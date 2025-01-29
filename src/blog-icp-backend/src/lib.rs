use std::cell::RefCell;

use crate::blog::Blog;
use crate::config::Config;

mod blog;
mod config;

thread_local! {
    static CONFIG: RefCell<Config> = RefCell::new(Config::new());
    static BLOGS: RefCell<Vec<Blog>> = RefCell::new(Vec::new());
}
// komentarze ?

#[ic_cdk::update]
fn add_config(new_config: Config) {
    CONFIG.with(|config| *config.borrow_mut() = new_config);
}

#[ic_cdk::update]
fn add_blog(title: String, content: String, tags: Vec<String>) -> Result<Blog, String>{
    ic_cdk::println!("Trying to add blog: (title: {}, content: {}, tags: {:?})", title, content, tags);
    let config = CONFIG.with(|config| config.borrow().clone());
    if title.len() > config.max_title_len as usize {
        return Err("Title is too long!".to_string())
    }
    if content.len() > config.max_content_len as usize {
        return Err("Content is too long!".to_string())
    }
    if tags.len() > config.max_tags_count as usize {
        return Err("Too many tags!".to_string())
    }
    let are_tags_in_config_tags = tags.iter().any(|tag| !config.tags.contains(tag));
    if are_tags_in_config_tags {
        return Err("Tags are not valid!".to_string()) 
    }
    
    let blog = Blog::new(title, content, tags);
    BLOGS.with(|blogs| blogs.borrow_mut().push(blog));
    let last_blog = BLOGS.with(|blogs| 
        blogs
        .borrow()
        .last()
        .expect("Vec should not be empty").clone());
    Ok(last_blog)
}

#[ic_cdk::query]
fn get_blogs() -> Vec<Blog> {
    BLOGS.with(|blogs| blogs.borrow().clone())
}

#[ic_cdk::query]
fn get_config() -> Config {
    CONFIG.with(|config| config.borrow().clone())
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
