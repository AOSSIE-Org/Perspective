# Privacy Policy

**Last updated:** 1 November 2026

## Introduction

Perspective (the App) is committed to protecting your privacy and providing a transparent and user-friendly experience.

This Privacy Policy explains how the App handles information when you use it at [perspective.aossie.org](https://perspective.aossie.org) or through its backend service.

The App follows a privacy-conscious approach. It has no user accounts, no cookies, no analytics and no advertising. It processes only what it needs to analyse the articles you submit.

## Information and Permissions

The App does not ask for your name, email or any other personal details, and does not request any device permissions. To work, it processes:

- **Article URLs you submit**, and the text of those articles, which the backend downloads from the article's website
- **Chat questions** you ask about an analysed article
- **Analysis results** the App generates (bias score, sentiment, fact checks and the counter-perspective)

Only submit links to public articles, and don't include personal information in chat questions.

## Data Storage

Any information stored in remote servers is limited to what is necessary for the App's functionality. The App stores the following:

- **Your browser (session storage):** the submitted URL (`articleUrl`), the chosen topic (`selectedTopicTitle`) and the results (`analysisResult`, `BiasScore`), so the results page can show them. They are deleted when you close the tab. Your light or dark mode choice is kept in local storage (`theme`).
- **Pinecone (vector database):** the counter-perspective and fact checks generated for an article, with an ID derived from the article's text, so the chat can answer questions about it. No information about you is stored with them.
- **Backend logs (Hugging Face Spaces):** for debugging, the backend's logs record the article URLs you submit, the claims extracted from articles, search results, analysis results and chat answers. With debug logging switched on, they can also contain the full article text and the context used to answer chat questions. Logs are not linked to an account, but the hosting platform also records request details such as IP addresses.

## Data Sharing

The App does not sell your personal information.

The App does not use personal information for targeted advertising.

The App may communicate with third parties when required to provide specific features. Any information transmitted to such services is limited to what is necessary for the App's functionality. The following is a list of third parties and the information that may be shared with them:

- **The article's website:** the backend requests the article from the URL you submit. The website sees the backend's request, not your IP address.
- **Groq** (AI analysis): the article text, the claims extracted from it, and your chat questions, to generate the analysis and chat answers. See [Groq's privacy policy](https://groq.com/privacy-policy/).
- **Google Custom Search, or DuckDuckGo as a fallback** (fact checking): search queries built from the article's claims. See [Google's privacy policy](https://policies.google.com/privacy) and [DuckDuckGo's privacy policy](https://duckduckgo.com/privacy).
- **Pinecone** (vector database): the generated perspective and fact checks described under Data Storage, and your chat questions as numeric embeddings (computed on the backend) to find the relevant facts. See [Pinecone's privacy policy](https://www.pinecone.io/privacy/).
- **Hugging Face** (backend hosting): every request to the backend, including its content and your IP address. See [Hugging Face's privacy policy](https://huggingface.co/privacy).
- **GitHub Pages** (frontend hosting): your IP address and standard request details when your browser loads the App. See [GitHub's Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).
- **Share platforms:** the Share button in the navigation bar opens the platform you choose (WhatsApp, X, LinkedIn, Telegram or your email app) with the page's address, or copies it. That platform's privacy policy applies; the App does not record what you share.
- **GitHub Sponsors:** the Support page links to [GitHub Sponsors](https://github.com/sponsors/AOSSIE-Org). If you choose to donate, you do so on GitHub, and GitHub's privacy statement applies.

Where a third party processes information, its handling of that information is governed by its own privacy policy and terms of service.

## Data Security

The App aims to minimize privacy and security risks by not collecting personal details, keeping results in your browser's session, and validating every submitted URL before the backend fetches it.

However, no method of electronic storage or transmission can be guaranteed to be completely secure. Users are also responsible for maintaining the security of their devices.

## Data Deletion

Results kept in your browser are deleted when you close the tab. You can also clear your browser's site data for perspective.aossie.org at any time.

Where information is stored on servers, you may request deletion of the analysis for a specific article by emailing [contact@aossie.org](mailto:contact@aossie.org) with the article's URL.

## Children's Privacy

The App is not intended to knowingly collect personal information from children where such collection is prohibited by applicable law. It does not ask anyone for personal information.

## Free Access

The App aims to keep its core functionality accessible to users without requiring mandatory subscriptions or payments to unlock essential features. It is free to use, with no paid features.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes to the App, its functionality, or applicable legal requirements.

Any updates will be made available wherever this Privacy Policy is published.

## Contact Us

If you have any questions or concerns about this Privacy Policy or the App's privacy practices, please contact us at:

[contact@aossie.org](mailto:contact@aossie.org)
