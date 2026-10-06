import type { SummaryResult } from "../services/summarizer.js";

type DigestEmailProps = {
    articles: SummaryResult[];
};

export default function DigestEmail({ articles }: DigestEmailProps) {
    return (
        <div>
            {articles.map((article, index) => (
                <div key={index}>
                    <p>{article.summary}</p>
                    {article.link ? <a href={article.link}>Read more</a> : null}
                </div>
            ))}
        </div>
    );
}
