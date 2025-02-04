use std::cell::RefCell;

use ic_cdk_macros::{init, query, update};
use ic_cdk::export::candid::{CandidType, Deserialize};
use ic_cdk::api::{caller, time};
use candid::Principal;

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

pub fn get_time() -> u64 {
    #[cfg(test)]
    {
        0
    }
    #[cfg(not(test))]
    {
        ic_cdk::api::time()
    }
}

fn get_caller() -> Principal {
    #[cfg(test)]
    {
        Principal::from_text("aaaaa-aa").unwrap()
    }
    #[cfg(not(test))]
    {
        ic_cdk::api::caller()
    }
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
            if blog.owner.to_text() != caller.to_text() {
                return BlogResult::Err("You can only edit your own posts.".to_string());
            }

            if let Some(t) = new_title {
                blog.title = t;
            }

            if let Some(c) = new_content {
                blog.content = c;
            }

            if let Some(ts) = new_tags {
                blog.tags = ts;
            }

            return BlogResult::Ok(blog.clone());
        }
        BlogResult::Err("Blog not found".to_string())
    })
}

#[update]
fn remove_blog(blog_id: u64) -> Result<(), String> {
    let caller = caller();
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        let len_before = blogs_ref.len();
        blogs_ref.retain(|b| b.id != blog_id || b.owner == caller);

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
    let caller = get_caller();
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            let comment_id = NEXT_COMMENT_ID.with(|id| {
                let current = *id.borrow();
                *id.borrow_mut() = current + 1;
                current
            });

            let new_comment = Comment::new(comment_id, caller, content);
            blog.comments.push(new_comment.clone());
            return CommentResult::Ok(new_comment);
        }
        CommentResult::Err("Blog not found".to_string())
    })
}

#[update]
fn edit_comment(blog_id: u64, comment_id: u64, new_content: String) -> CommentResult {
    let caller = get_caller();
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            if let Some(comment) = blog.comments.iter_mut().find(|c| c.id == comment_id) {
                if comment.owner != caller {
                    return CommentResult::Err("You can only edit your own comments.".to_string());
                }

                comment.content = new_content;
                comment.date = get_time();
                return CommentResult::Ok(comment.clone());
            }
            return CommentResult::Err("Comment not found".to_string());
        }
        CommentResult::Err("Blog not found".to_string())
    })
}

#[update]
fn remove_comment(blog_id: u64, comment_id: u64) -> Result<(), String> {
    let caller = get_caller();
    BLOGS.with(|blogs| {
        let mut blogs_ref = blogs.borrow_mut();
        if let Some(blog) = blogs_ref.iter_mut().find(|b| b.id == blog_id) {
            let len_before = blog.comments.len();
            blog.comments.retain(|c| c.id != comment_id || c.owner != caller);
            if blog.comments.len() == len_before {
                return Err("You can only delete your own comments.".to_string());
            }
            return Ok(());
        }
        Err("Blog not found".to_string())
    })
}

#[update]
fn remove_tag_from_config(tag: String) -> Result<(), String> {
    CONFIG.with(|config| {
        config.borrow_mut().remove_tag(&tag)
    })
}

//Testy jednostkowe
#[cfg(test)]
mod tests {
    use super::*;
    use ic_cdk::export::Principal;

    fn clear_state() {
        BLOGS.with(|blogs| {
            blogs.borrow_mut().clear();
        });
        CONFIG.with(|config| {
            *config.borrow_mut() = Config::new();
        });
        NEXT_BLOG_ID.with(|id| {
            *id.borrow_mut() = 0;
        });
        NEXT_COMMENT_ID.with(|id| {
            *id.borrow_mut() = 0;
        });
    }

    #[test]
    fn test_add_blog_success() {
        clear_state();
        let _ = add_tag_to_config("tag1".to_string());
        let result = add_blog(
            "Test Post".to_string(),
            "This is the content".to_string(),
            vec!["tag1".to_string()],
        );
        match result {
            BlogResult::Ok(blog) => {
                let expected = get_caller();
                assert_eq!(blog.owner.to_text(), expected.to_text());
                assert_eq!(blog.title, "Test Post");
                assert_eq!(blog.content, "This is the content");
                assert_eq!(blog.tags, vec!["tag1".to_string()]);
            }
            BlogResult::Err(err) => panic!("Dodawanie posta nie powiodło się: {}", err),
        }
    }

    #[test]
    fn test_edit_blog_success() {
        clear_state();
        let _ = add_tag_to_config("tag1".to_string());
        let _ = add_tag_to_config("tag2".to_string());
        let result = add_blog(
            "Test Post".to_string(),
            "Original content".to_string(),
            vec!["tag1".to_string()],
        );
        let blog = match result {
            BlogResult::Ok(b) => b,
            BlogResult::Err(err) => panic!("Dodawanie posta nie powiodło się: {}", err),
        };

        let edit_result = edit_blog(
            blog.id,
            Some("Edited Post".to_string()),
            Some("Edited content".to_string()),
            Some(vec!["tag2".to_string()]),
        );
        match edit_result {
            BlogResult::Ok(edited_blog) => {
                assert_eq!(edited_blog.title, "Edited Post");
                assert_eq!(edited_blog.content, "Edited content");
                assert_eq!(edited_blog.tags, vec!["tag2".to_string()]);
            }
            BlogResult::Err(err) => panic!("Edycja posta nie powiodła się: {}", err),
        }
    }

    #[test]
    fn test_add_comment_success() {
        clear_state();
        let _ = add_tag_to_config("tag1".to_string());
        let result = add_blog(
            "Test Post".to_string(),
            "Some content".to_string(),
            vec!["tag1".to_string()],
        );
        let blog = match result {
            BlogResult::Ok(b) => b,
            BlogResult::Err(err) => panic!("Dodawanie posta nie powiodło się: {}", err),
        };

        let comment_result = add_comment(blog.id, "This is a comment".to_string());
        match comment_result {
            CommentResult::Ok(comment) => {
                let expected = get_caller();
                assert_eq!(comment.owner.to_text(), expected.to_text());
                assert_eq!(comment.content, "This is a comment");
            }
            CommentResult::Err(err) => panic!("Dodawanie komentarza nie powiodło się: {}", err),
        }
    }

    #[test]
    fn test_edit_comment_success() {
        clear_state();
        let _ = add_tag_to_config("tag1".to_string());
        let result = add_blog(
            "Test Post".to_string(),
            "Some content".to_string(),
            vec!["tag1".to_string()],
        );
        let blog = match result {
            BlogResult::Ok(b) => b,
            BlogResult::Err(err) => panic!("Dodawanie posta nie powiodło się: {}", err),
        };

        let comment_result = add_comment(blog.id, "Initial comment".to_string());
        let comment = match comment_result {
            CommentResult::Ok(c) => c,
            CommentResult::Err(err) => panic!("Dodawanie komentarza nie powiodło się: {}", err),
        };

        let edit_result = edit_comment(blog.id, comment.id, "Edited comment".to_string());
        match edit_result {
            CommentResult::Ok(edited_comment) => {
                assert_eq!(edited_comment.content, "Edited comment");
            }
            CommentResult::Err(err) => panic!("Edycja komentarza nie powiodła się: {}", err),
        }
    }

    #[test]
    fn test_remove_comment_success() {
        clear_state();
        let _ = add_tag_to_config("tag1".to_string());
        let result = add_blog(
            "Test Post".to_string(),
            "Some content".to_string(),
            vec!["tag1".to_string()],
        );
        let blog = match result {
            BlogResult::Ok(b) => b,
            BlogResult::Err(err) => panic!("Dodawanie posta nie powiodło się: {}", err),
        };

        let comment_result = add_comment(blog.id, "Comment to remove".to_string());
        let comment = match comment_result {
            CommentResult::Ok(c) => c,
            CommentResult::Err(err) => panic!("Dodawanie komentarza nie powiodło się: {}", err),
        };

        let remove_result = remove_comment(blog.id, comment.id);
        assert!(remove_result.is_ok());
        BLOGS.with(|blogs| {
            let blogs_ref = blogs.borrow();
            let blog_opt = blogs_ref.iter().find(|b| b.id == blog.id);
            if let Some(b) = blog_opt {
                assert!(b.comments.iter().find(|c| c.id == comment.id).is_none());
            } else {
                panic!("Blog nie został znaleziony");
            }
        });
    }

    #[test]
    fn test_add_tag_success() {
        clear_state();
        let result = add_tag_to_config("tag1".to_string());
        assert!(result.is_ok());
        let config = get_config();
        assert!(config.tags.contains(&"tag1".to_string()));
    }

    #[test]
    fn test_remove_tag_success() {
        clear_state();
        let _ = add_tag_to_config("tag1".to_string());
        let remove_result = remove_tag_from_config("tag1".to_string());
        assert!(remove_result.is_ok());
        let config = get_config();
        assert!(!config.tags.contains(&"tag1".to_string()));
    }
}

