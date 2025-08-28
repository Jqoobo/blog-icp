use crate::get_time;
use candid::{CandidType, Deserialize as CandidDeserialize, Principal};
use serde::Serialize;


/// Pojedynczy komentarz do posta.
#[derive(Clone, CandidType, CandidDeserialize, Debug, PartialEq, Eq, Serialize)]
pub struct Comment {
    pub id: u64,
    pub owner: Principal,
    pub content: String,
    pub date: u64,
}

/// Post na blogu z listą komentarzy.
#[derive(Clone, CandidType, CandidDeserialize, Debug, PartialEq, Eq, Serialize)]
pub struct Blog {
    pub id: u64,
    pub owner: Principal,
    pub title: String,
    pub date: u64,
    pub content: String,
    pub tags: Vec<String>,
    pub comments: Vec<Comment>,
}

impl Comment {
    pub fn new(id: u64, owner: Principal, content: String) -> Self {
        Self { id, owner, content, date: get_time() }
    }
}

impl Blog {
    pub fn new(id: u64, owner: Principal, title: String, content: String, tags: Vec<String>) -> Self {
        Self { id, owner, title, date: get_time(), content, tags, comments: Vec::new() }
    }

    pub fn apply_update(
        &mut self,
        new_title: Option<String>,
        new_content: Option<String>,
        new_tags: Option<Vec<String>>,
    ) {
        if let Some(t) = new_title { self.title = t; }
        if let Some(c) = new_content { self.content = c; }
        if let Some(ts) = new_tags { self.tags = ts; }
    }

    pub fn add_comment(&mut self, comment: Comment) {
        self.comments.push(comment);
    }

    pub fn edit_comment(&mut self, comment_id: u64, new_content: String) -> Result<&Comment, String> {
        if let Some(c) = self.comments.iter_mut().find(|c| c.id == comment_id) {
            c.content = new_content;
            c.date = get_time();
            Ok(c)
        } else {
            Err("Comment not found".to_string())
        }
    }

    pub fn remove_comment(&mut self, comment_id: u64) -> bool {
        let before = self.comments.len();
        self.comments.retain(|c| c.id != comment_id);
        self.comments.len() < before
    }
}
