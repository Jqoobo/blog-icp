use std::cell::RefCell;

use candid::{CandidType, Deserialize as CandidDeserialize, Principal};
use ic_cdk::api::{caller, time};
use ic_cdk_macros::{init, query, update};
use serde::{Deserialize as SerdeDeserialize, Serialize};
use serde_json::json;

#[derive(Debug, Clone, CandidType, serde::Deserialize)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

#[derive(Debug, Clone, CandidType, serde::Serialize)]
pub struct HttpResponse {
    pub status_code: u16,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
    pub upgrade: Option<bool>,
}

pub type HeaderField = (String, String);

mod blog;
mod config;

use blog::{Blog, Comment};
use config::Config;

// ----------------- STAN KANISTRA -----------------

thread_local! {
    static CONFIG: RefCell<Config> = RefCell::new(Config::new());
    static BLOGS: RefCell<Vec<Blog>> = RefCell::new(Vec::new());

    static NEXT_BLOG_ID: RefCell<u64> = RefCell::new(0);
    static NEXT_COMMENT_ID: RefCell<u64> = RefCell::new(0);
}

// ----------------- WYNIKI CANDID -----------------

#[derive(CandidType, CandidDeserialize, Debug)]
pub enum BlogResult {
    Ok(Blog),
    Err(String),
}

#[derive(CandidType, CandidDeserialize, Debug)]
pub enum CommentResult {
    Ok(Comment),
    Err(String),
}

// ----------------- INIT -----------------

#[init]
fn init() {
    ic_cdk::println!("Canister init");
}

// ----------------- NARZĘDZIA -----------------

pub fn get_time() -> u64 {
    #[cfg(test)] { 0 }
    #[cfg(not(test))] { time() }
}

fn get_caller() -> Principal {
    #[cfg(test)] { Principal::from_text("aaaaa-aa").unwrap() }
    #[cfg(not(test))] { caller() }
}

// ----------------- API CANDID (twoje oryginalne) -----------------

#[query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[update]
fn add_config(new_config: Config) {
    CONFIG.with(|c| *c.borrow_mut() = new_config);
}

#[update]
fn add_tag_to_config(tag: String) -> Result<(), String> {
    CONFIG.with(|config| {
        let mut cfg = config.borrow_mut();
        if cfg.tags.contains(&tag) {
            return Err("Ten tag już istnieje w config.tags".to_string());
        }
        cfg.tags.push(tag);
        Ok(())
    })
}

#[query]
fn get_config() -> Config {
    CONFIG.with(|c| c.borrow().clone())
}

#[update]
fn add_blog(title: String, content: String, tags: Vec<String>) -> BlogResult {
    let config = CONFIG.with(|c| c.borrow().clone());

    if title.len() > config.max_title_len as usize {
        return BlogResult::Err("Title is too long!".to_string());
    }
    if content.len() > config.max_content_len as usize {
        return BlogResult::Err("Content is too long!".to_string());
    }
    if tags.len() > config.max_tags_count as usize {
        return BlogResult::Err("Too many tags!".to_string());
    }
    let invalid_tag = tags.iter().find(|tag| !config.tags.contains(*tag));
    if invalid_tag.is_some() {
        return BlogResult::Err("Tags are not valid!".to_string());
    }

    let who = get_caller();

    let blog_id = NEXT_BLOG_ID.with(|id| {
        let current = *id.borrow();
        *id.borrow_mut() = current + 1;
        current
    });

    let new_blog = Blog::new(blog_id, who, title, content, tags);

    BLOGS.with(|blogs| {
        blogs.borrow_mut().push(new_blog.clone());
    });

    BlogResult::Ok(new_blog)
}

#[update]
fn edit_blog(blog_id: u64, new_title: Option<String>, new_content: Option<String>, new_tags: Option<Vec<String>>) -> BlogResult {
    let caller = get_caller();
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();

        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            if blog.owner != caller {
                return BlogResult::Err("You can only edit your own posts.".to_string());
            }

            blog.apply_update(new_title, new_content, new_tags);
            return BlogResult::Ok(blog.clone());
        }
        BlogResult::Err("Blog not found".to_string())
    })
}

#[update]
fn remove_blog(blog_id: u64) -> Result<(), String> {
    let who = get_caller();
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        let len_before = blogs_ref.len();
        blogs_ref.retain(|b| !(b.id == blog_id && b.owner == who));

        if blogs_ref.len() == len_before {
            return Err("You can only delete your own posts.".to_string());
        }
        Ok(())
    })
}

#[query]
fn get_blogs() -> Vec<Blog> {
    BLOGS.with(|blogs| blogs.borrow().clone())
}

#[update]
fn add_comment(blog_id: u64, content: String) -> CommentResult {
    let who = get_caller();
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            let comment_id = NEXT_COMMENT_ID.with(|id| {
                let current = *id.borrow();
                *id.borrow_mut() = current + 1;
                current
            });

            let new_comment = Comment::new(comment_id, who, content);
            blog.add_comment(new_comment.clone());
            return CommentResult::Ok(new_comment);
        }
        CommentResult::Err("Blog not found".to_string())
    })
}

#[update]
fn edit_comment(blog_id: u64, comment_id: u64, new_content: String) -> CommentResult {
    let who = get_caller();
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            if let Some(c) = blog.comments.iter().find(|c| c.id == comment_id) {
                if c.owner != who {
                    return CommentResult::Err("You can only edit your own comments.".to_string());
                }
            }
            match blog.edit_comment(comment_id, new_content) {
                Ok(updated) => CommentResult::Ok(updated.clone()),
                Err(e) => CommentResult::Err(e),
            }
        } else {
            CommentResult::Err("Blog not found".to_string())
        }
    })
}

#[update]
fn remove_comment(blog_id: u64, comment_id: u64) -> Result<(), String> {
    let who = get_caller();
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            // pozwalamy usunąć tylko swój komentarz
            if let Some(c) = blog.comments.iter().find(|c| c.id == comment_id) {
                if c.owner != who {
                    return Err("You can only delete your own comments.".to_string());
                }
            } else {
                return Err("Comment not found".to_string());
            }
            let removed = blog.remove_comment(comment_id);
            if removed { Ok(()) } else { Err("Comment not found".to_string()) }
        } else {
            Err("Blog not found".to_string())
        }
    })
}

#[update]
fn remove_tag_from_config(tag: String) -> Result<(), String> {
    CONFIG.with(|config| {
        config.borrow_mut().remove_tag(&tag)
    })
}

// ----------------- HTTP HELPERS -----------------

fn cors_headers() -> Vec<HeaderField> {
    vec![
        ("Content-Type".into(), "application/json; charset=utf-8".into()),
        ("Access-Control-Allow-Origin".into(), "*".into()),
        ("Access-Control-Allow-Methods".into(), "GET,POST,PUT,DELETE,OPTIONS".into()),
        ("Access-Control-Allow-Headers".into(), "Content-Type,Authorization".into()),
    ]
}

fn ok_json<T: Serialize>(value: &T) -> HttpResponse {
    HttpResponse { status_code: 200, headers: cors_headers(), body: serde_json::to_vec(value).unwrap().into(), upgrade: None }
}
fn created_json<T: Serialize>(value: &T) -> HttpResponse {
    HttpResponse { status_code: 201, headers: cors_headers(), body: serde_json::to_vec(value).unwrap().into(), upgrade: None }
}
fn no_content() -> HttpResponse {
    HttpResponse { status_code: 204, headers: cors_headers(), body: vec![].into(), upgrade: None }
}
fn bad_request(msg: &str) -> HttpResponse {
    HttpResponse { status_code: 400, headers: cors_headers(), body: serde_json::to_vec(&json!({ "error": msg })).unwrap().into(), upgrade: None }
}
fn not_found() -> HttpResponse {
    HttpResponse { status_code: 404, headers: cors_headers(), body: serde_json::to_vec(&json!({ "error": "Not found" })).unwrap().into(), upgrade: None }
}
fn method_not_allowed() -> HttpResponse {
    HttpResponse { status_code: 405, headers: cors_headers(), body: serde_json::to_vec(&json!({ "error": "Method not allowed" })).unwrap().into(), upgrade: None }
}

fn path_segments(url: &str) -> Vec<&str> {
    // odcina query string, jeśli jest
    let path = url.splitn(2, '?').next().unwrap_or(url);
    path.trim_start_matches('/').split('/').collect()
}

fn parse_qs(url: &str) -> std::collections::HashMap<String, String> {
    let mut map = std::collections::HashMap::new();
    if let Some(q) = url.splitn(2, '?').nth(1) {
        for kv in q.split('&') {
            if let Some((k, v)) = kv.split_once('=') {
                map.insert(k.to_string(), v.to_string());
            }
        }
    }
    map
}

// Payloady JSON dla REST
#[derive(SerdeDeserialize)]
struct NewPost { title: String, content: String, tags: Vec<String> }

#[derive(SerdeDeserialize)]
struct UpdatePost { title: Option<String>, content: Option<String>, tags: Option<Vec<String>> }

#[derive(SerdeDeserialize)]
struct NewComment { content: String }

#[derive(SerdeDeserialize)]
struct UpdateComment { content: String }

// ----------------- HTTP ROUTER -----------------

/// READ (bez mutacji) + sygnał upgrade dla metod modyfikujących
#[query]
fn http_request(req: HttpRequest) -> HttpResponse {
    // Preflight CORS
    if req.method == "OPTIONS" {
        return no_content();
    }

    let seg = path_segments(&req.url);

    match (req.method.as_str(), seg.as_slice()) {
        // GET /api/posts?offset=&limit=
        ("GET", ["api", "posts"]) => {
            let qs = parse_qs(&req.url);
            let offset = qs.get("offset").and_then(|v| v.parse::<usize>().ok()).unwrap_or(0);
            let limit  = qs.get("limit").and_then(|v| v.parse::<usize>().ok()).unwrap_or(50);

            let data = BLOGS.with(|blogs| {
                let v = blogs.borrow();
                if offset >= v.len() { return Vec::<Blog>::new(); }
                let end = (offset + limit).min(v.len());
                v[offset..end].to_vec()
            });
            ok_json(&data)
        }

        // GET /api/posts/{id}
        ("GET", ["api", "posts", id]) => {
            let id = id.parse::<u64>().unwrap_or(u64::MAX);
            if id == u64::MAX { return bad_request("Invalid post id"); }
            let one = BLOGS.with(|bs| bs.borrow().iter().find(|b| b.id == id).cloned());
            match one {
                Some(blog) => ok_json(&blog),
                None => not_found(),
            }
        }

        // Write' y -> upgrade do `http_request_update`
        ("POST", ["api", ..]) | ("PUT", ["api", ..]) | ("DELETE", ["api", ..]) => {
            HttpResponse { status_code: 204, headers: cors_headers(), body: vec![].into(), upgrade: Some(true) }
        }

        _ => not_found(),
    }
}

/// WRITE (mutacje) – faktyczne modyfikacje stanu
#[update]
fn http_request_update(req: HttpRequest) -> HttpResponse {
    let seg = path_segments(&req.url);

    match (req.method.as_str(), seg.as_slice()) {
        // POST /api/posts  -> add_blog
        ("POST", ["api", "posts"]) => {
            let body = String::from_utf8(req.body.clone()).unwrap_or_default();
            match serde_json::from_str::<NewPost>(&body) {
                Ok(input) => match add_blog(input.title, input.content, input.tags) {
                    BlogResult::Ok(blog) => created_json(&blog),
                    BlogResult::Err(e)   => bad_request(&e),
                },
                Err(_) => bad_request("Invalid JSON payload"),
            }
        }

        // PUT /api/posts/{id}  -> edit_blog
        ("PUT", ["api", "posts", id]) => {
            let id = id.parse::<u64>().unwrap_or(u64::MAX);
            if id == u64::MAX { return bad_request("Invalid post id"); }
            let body = String::from_utf8(req.body.clone()).unwrap_or_default();
            match serde_json::from_str::<UpdatePost>(&body) {
                Ok(u) => match edit_blog(id, u.title, u.content, u.tags) {
                    BlogResult::Ok(blog) => ok_json(&blog),
                    BlogResult::Err(e)   => bad_request(&e),
                },
                Err(_) => bad_request("Invalid JSON payload"),
            }
        }

        // DELETE /api/posts/{id} -> remove_blog
        ("DELETE", ["api", "posts", id]) => {
            let id = id.parse::<u64>().unwrap_or(u64::MAX);
            if id == u64::MAX { return bad_request("Invalid post id"); }
            match remove_blog(id) {
                Ok(()) => no_content(),
                Err(e) => bad_request(&e),
            }
        }

        // POST /api/posts/{id}/comments -> add_comment
        ("POST", ["api", "posts", id, "comments"]) => {
            let post_id = id.parse::<u64>().unwrap_or(u64::MAX);
            if post_id == u64::MAX { return bad_request("Invalid post id"); }
            let body = String::from_utf8(req.body.clone()).unwrap_or_default();
            match serde_json::from_str::<NewComment>(&body) {
                Ok(input) => match add_comment(post_id, input.content) {
                    CommentResult::Ok(c) => created_json(&c),
                    CommentResult::Err(e) => bad_request(&e),
                },
                Err(_) => bad_request("Invalid JSON payload"),
            }
        }

        // PUT /api/posts/{postId}/comments/{commentId} -> edit_comment
        ("PUT", ["api", "posts", pid, "comments", cid]) => {
            let post_id = pid.parse::<u64>().unwrap_or(u64::MAX);
            let comment_id = cid.parse::<u64>().unwrap_or(u64::MAX);
            if post_id == u64::MAX || comment_id == u64::MAX { return bad_request("Invalid ids"); }
            let body = String::from_utf8(req.body.clone()).unwrap_or_default();
            match serde_json::from_str::<UpdateComment>(&body) {
                Ok(input) => match edit_comment(post_id, comment_id, input.content) {
                    CommentResult::Ok(c) => ok_json(&c),
                    CommentResult::Err(e) => bad_request(&e),
                },
                Err(_) => bad_request("Invalid JSON payload"),
            }
        }

        // DELETE /api/posts/{postId}/comments/{commentId} -> remove_comment
        ("DELETE", ["api", "posts", pid, "comments", cid]) => {
            let post_id = pid.parse::<u64>().unwrap_or(u64::MAX);
            let comment_id = cid.parse::<u64>().unwrap_or(u64::MAX);
            if post_id == u64::MAX || comment_id == u64::MAX { return bad_request("Invalid ids"); }
            match remove_comment(post_id, comment_id) {
                Ok(()) => no_content(),
                Err(e) => bad_request(&e),
            }
        }

        _ => method_not_allowed(),
    }
}
