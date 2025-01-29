use candid::CandidType;
use ic_cdk::api::time;

#[derive(Clone, CandidType)]
pub struct Blog {
    title: String,
    date: u64,
    content: String,
    tags: Vec<String>
}

impl Blog {
    pub fn new(title: String, content: String, tags: Vec<String>) -> Self {
        Self {
            title,
            date: time(),
            content,
            tags
        }
    }
}