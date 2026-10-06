/*CREATE TABLE writers (
    id TEXT PRIMARY KEY,
    substack_url TEXT UNIQUE,
    display_name TEXT,
    feed_url TEXT UNIQUE,
    added_at TIMESTAMP
)

CREATE TABLE articles (
    id TEXT PRIMARY KEY,
    writer_id TEXT NOT NULL,
    title TEXT NOT NULL,
    article_url TEXT NOT NULL UNIQUE,
    published_at TIMESTAMP,
    raw_content TEXT,
    fetched_at TIMESTAMP,
    CONSTRAINT fk_articles_writer FOREIGN KEY (writer_id) REFERENCES writers(id)
)

CREATE TABLE summaries (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    summary_text TEXT,
    generated_at TIMESTAMP,
    CONSTRAINT fk_articles_summaries FOREIGN KEY (article_id) REFERENCES articles(id)
)

CREATE TABLE digests (
    id TEXT PRIMARY KEY,
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    sent_at TIMESTAMP,
    status TEXT
)

CREATE TABLE digest_articles (
    digest_id TEXT NOT NULL REFERENCES digests(id),
    article_id TEXT NOT NULL REFERENCES articles(id),
    PRIMARY KEY (digest_id, article_id)
)


CREATE TABLE settings (
    user_id TEXT,
    cadence TEXT,
    delivery_email TEXT,
    send_day DATE
)*/
CREATE TABLE writers (
    id TEXT PRIMARY_KEY,
    substack_url TEXT UNIQUE,
    display_name TEXT,
    feed_url TEXT UNIQUE,
    added_at TIMESTAMP
)

CREATE TABLE articles (
    id TEXT PRIMARY_KEY,
    writer_id TEXT NOT_NULL FOREIGN_KEY,
    article_id TEXT UNIQUE,
    article_url TEXT UNIQUE,
    published_at TIMESTAMP
    raw_content TEXT,
    fetched_at TIMESTAMP,
    CONSTRAINT fk_articles_writer FOREIGN KEY (writer_id) REFERENCES writers(id)
)

CREATE TABLE summaries (
    id TEXT UNIQUE,
    article_id TEXT,
    summary_text TEXT UNIQUE,
    generated_at TIMESTAMP,
    CONSTRAINT fk_articles_summaries FOREIGN KEY (article_id) REFERENCES articles(id)
)

CREATE TABLE digests (
    id TEXT UNIQUE,
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    sent_at TIMESTAMP,
    status TEXT
)


CREATE TABLE digest_articles(
    digest_id TEXT NOT NULL REFERENCES digests(id),
    article_id TEXT NOT NULL REFERENCES articles(id),
    PRIMARY KEY (digest_id, article_id)
)

CREATE TABLE settings (
    user_id TEXT,
    cadence TEXT,
    delivery_email TEXT,
    send_day DATE
)


