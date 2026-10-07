# AIR Phalia Campus
Bilingual responsive school website. Enquiries persist in D1. The school guide answers approved FAQs; optional server-side AI requires OPENAI_API_KEY. WhatsApp webhook requires all listed secrets and a confirmed business number; it is not live by default. Confirm current Meta API version before configuration.
## Launch requirements
Confirm WhatsApp number, campus address spelling, lab operational status, fees, opening hours and any affiliation claims. Supply approved campus photographs and principal message. No unverified third-party affiliation badges are published.
## Operations
Enquiries are stored securely but automatic staff notification is not configured. Review enquiries using the token-protected admin endpoint after configuring ADMIN_TOKEN. Do not share the token or paste it into URLs. School visits require staff confirmation. WhatsApp processing records successful message IDs; concurrent or interrupted deliveries may still duplicate replies, requiring a durable queue before high-volume launch. No outbound marketing templates are included.
## Environment
See .env.example. Store secrets only in hosting settings. Build with the bundled build-site helper. D1 migrations live in drizzle. Privacy retention policy should be approved by school prior to public launch.

## Head-office content audit — 7 October 2026
Summarized mission, vision and broad curriculum from https://afss.pk/assets/frontend_new/img/prospectus.pdf (2025 onwards). Parent involvement and learning priorities informed by https://afss.pk/cla/teachers. Office contact and resource links verified from https://afss.pk/afss/publications. Main homepage fetch failed, but official internal pages and prospectus were readable. Network statistics differed between indexed and retrieved versions and were omitted. Certification claims, specific campus implementation, head-office admissions deadlines and fee rules were not imported as Phalia policies. Booklist link is published by head office but its contents were not reviewed due to large file size; calendar link is official but no dates are copied as current campus dates. No confidential curriculum documents reproduced.
