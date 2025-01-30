use std::cell::RefCell;

use ic_cdk_macros::{init, query, update};
use ic_cdk::export::candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

mod blog;
mod config;

use blog::{Blog, Comment};
use config::Config;

thread_local! {
    static CONFIG: RefCell<Config> = RefCell::new(Config::new());
    static BLOGS: RefCell<Vec<Blog>> = RefCell::new(Vec::new());

    static NEXT_BLOG_ID: RefCell<u64> = RefCell::new(0);
    static NEXT_COMMENT_ID: RefCell<u64> = RefCell::new(0);
}

#[derive(CandidType, Deserialize, Debug)]
pub enum BlogResult {
    Ok(Blog),
    Err(String),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum CommentResult {
    Ok(Comment),
    Err(String),
}

#[init]
fn init() {
    ic_cdk::println!("Canister init");
}

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

    let who = ic_cdk::api::caller();

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
fn edit_blog(
    blog_id: u64,
    new_title: Option<String>,
    new_content: Option<String>,
    new_tags: Option<Vec<String>>,
) -> BlogResult {
    let config = CONFIG.with(|c| c.borrow().clone());
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();

        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            if let Some(t) = new_title {
                if t.len() > config.max_title_len as usize {
                    return BlogResult::Err("Title is too long!".to_string());
                }
                blog.title = t;
            }

            if let Some(c) = new_content {
                if c.len() > config.max_content_len as usize {
                    return BlogResult::Err("Content is too long!".to_string());
                }
                blog.content = c;
            }

            if let Some(ts) = new_tags {
                if ts.len() > config.max_tags_count as usize {
                    return BlogResult::Err("Too many tags!".to_string());
                }
                let invalid_tag = ts.iter().find(|tag| !config.tags.contains(*tag));
                if invalid_tag.is_some() {
                    return BlogResult::Err("Tags are not valid!".to_string());
                }
                blog.tags = ts;
            }

            return BlogResult::Ok(blog.clone());
        }
        BlogResult::Err("Blog not found".to_string())
    })
}

// Usunięcie bloga
#[update]
fn remove_blog(blog_id: u64) -> Result<(), String> {
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        let len_before = blogs_ref.len();
        blogs_ref.retain(|b| b.id != blog_id);

        if blogs_ref.len() == len_before {
            return Err(format!("Blog with id={} not found", blog_id));
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
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            let comment_id = NEXT_COMMENT_ID.with(|id| {
                let current = *id.borrow();
                *id.borrow_mut() = current + 1;
                current
            });

            let new_comment = Comment::new(comment_id, content);
            blog.comments.push(new_comment.clone());
            return CommentResult::Ok(new_comment);
        }
        CommentResult::Err("Blog not found".to_string())
    })
}

#[update]
fn edit_comment(blog_id: u64, comment_id: u64, new_content: String) -> CommentResult {
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            if let Some(comment) = blog.comments.iter_mut().find(|c| c.id == comment_id) {
                comment.content = new_content;
                comment.date = ic_cdk::api::time();
                return CommentResult::Ok(comment.clone());
            }
            return CommentResult::Err("Comment not found".to_string());
        }
        CommentResult::Err("Blog not found".to_string())
    })
}

#[update]
fn remove_comment(blog_id: u64, comment_id: u64) -> Result<(), String> {
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            let len_before = blog.comments.len();
            blog.comments.retain(|c| c.id != comment_id);
            if blog.comments.len() == len_before {
                return Err("Comment not found".to_string());
            }
            return Ok(());
        }
        Err("Blog not found".to_string())
    })
}