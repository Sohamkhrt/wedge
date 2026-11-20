"""Two one-click judge demos + cached public evidence.

The cache is merged only when live scraping yields < 5 chunks (or `use_demo_cache=True`), so the
demo still works offline / when Reddit or a pricing page blocks bots.

HONESTY NOTE: cached items are PARAPHRASED SUMMARIES of recurring public themes, not verbatim
quotes. Each one is tagged `demo_cache`, says "(cached summary)" in its title, and links to the
real public page or a public search URL where the founder can verify the claim themselves.
Live-scraped items (competitor_page / hacker_news / reddit) are verbatim extracts.
"""
from __future__ import annotations

from typing import Any

DEMOS: list[dict[str, Any]] = [
    {
        "id": "campusats",
        "startup_name": "CampusATS",
        "pitch": "AI resume builder for college students applying to campus placements. "
                 "It tailors each resume to the job description and the ATS filters recruiters use.",
        "target_audience": "Final-year undergraduate students preparing for on-campus placement drives",
        "competitor_urls": ["https://www.kickresume.com/en/pricing/", "https://www.tealhq.com/pricing"],
        "competitor_names": ["Kickresume", "Teal"],
        "search_terms": ["Kickresume", "Teal resume", "resume builder students"],
    },
    {
        "id": "invoicepulse",
        "startup_name": "InvoicePulse",
        "pitch": "Automated invoice-chasing tool for solo freelance developers. "
                 "It sends polite, escalating payment reminders so freelancers get paid without awkward follow-ups.",
        "target_audience": "Solo freelance software developers billing 2-10 clients per month",
        "competitor_urls": ["https://www.waveapps.com/invoicing", "https://www.freshbooks.com/pricing"],
        "competitor_names": ["Wave", "FreshBooks"],
        "search_terms": ["FreshBooks", "Wave invoicing", "freelance late payment invoice"],
    },
]

_CACHE: dict[str, list[dict[str, Any]]] = {
    "campusats": [
        {
            "title": "Kickresume pricing page (cached summary)",
            "url": "https://www.kickresume.com/en/pricing/",
            "text": "Kickresume offers a free plan with a limited set of templates and features. "
                    "Premium access is sold as a recurring subscription billed monthly, quarterly or yearly. "
                    "Most AI writing features and premium templates sit behind the paid plan. "
                    "Pricing is the same for a student applying to one placement drive as for a mid-career professional.",
        },
        {
            "title": "Teal pricing page (cached summary)",
            "url": "https://www.tealhq.com/pricing",
            "text": "Teal provides a free resume builder and job tracker. "
                    "Teal+ is a paid weekly or monthly subscription that unlocks unlimited AI resume tailoring and keyword matching against job descriptions. "
                    "The product is positioned around the general job search of working professionals, with job tracking for many open applications.",
        },
        {
            "title": "Reddit search: student resume builder frustrations (cached summary)",
            "url": "https://www.reddit.com/search/?q=resume+builder+student+subscription",
            "text": "A recurring theme in student career threads: resume builders let you write the whole resume for free and then require a paid subscription to download a clean PDF. "
                    "Students say they forget to cancel after a one-time use and get charged again. "
                    "Many ask for a free alternative because they only need one strong resume per placement season.",
        },
        {
            "title": "Reddit search: campus placement resume format (cached summary)",
            "url": "https://www.reddit.com/search/?q=campus+placement+resume+format",
            "text": "Students preparing for campus placements frequently ask which resume format their college placement cell requires. "
                    "Many colleges mandate a fixed one-page template, so generic global templates from resume tools are rejected or need manual rework. "
                    "Seniors and placement coordinators share the template in WhatsApp groups and the PDF gets passed around.",
        },
        {
            "title": "Hacker News search: ATS keyword filtering (cached summary)",
            "url": "https://hn.algolia.com/?q=ATS%20resume%20keywords&type=comment",
            "text": "Hacker News commenters debate how much applicant tracking systems actually filter resumes by keywords. "
                    "Some recruiters say ATS ranking is overstated and humans skim every resume; others describe hard keyword filters at large employers. "
                    "The problem is that candidates cannot see which filter rules a specific employer uses, so tools sell generic ATS scores.",
        },
        {
            "title": "Reddit search: placement season prep (cached summary)",
            "url": "https://www.reddit.com/search/?q=placement+season+resume+shortlist",
            "text": "Students describe placement season as a short, intense window where dozens of companies visit in a few weeks. "
                    "They need a resume tailored per company role quickly, often the night before a shortlist deadline. "
                    "Tier-2 and tier-3 college students say they get less coaching and fewer resume reviews than students at top institutes.",
        },
        {
            "title": "Hacker News search: resume builder business model (cached summary)",
            "url": "https://hn.algolia.com/?q=resume%20builder%20subscription&type=comment",
            "text": "Commenters criticise subscription resume builders as a dark-pattern business model for a job people do a few times in a career. "
                    "Several suggest one-time pricing or pay-per-download would feel fairer, and note that institutions such as universities sometimes buy licenses for career tools in bulk.",
        },
    ],
    "invoicepulse": [
        {
            "title": "Wave invoicing page (cached summary)",
            "url": "https://www.waveapps.com/invoicing",
            "text": "Wave advertises free invoicing software for small businesses with customizable invoices and automatic payment reminders. "
                    "Online card and bank payments are charged a per-transaction processing fee. "
                    "The product is positioned for small business owners broadly, bundled with accounting and receipts.",
        },
        {
            "title": "FreshBooks pricing page (cached summary)",
            "url": "https://www.freshbooks.com/pricing",
            "text": "FreshBooks sells tiered monthly subscription plans for invoicing and accounting. "
                    "Lower tiers limit the number of billable clients, and advanced features sit on higher plans. "
                    "The suite includes time tracking, expenses, proposals and accounting reports aimed at service businesses.",
        },
        {
            "title": "Reddit search: freshbooks alternative freelancer (cached summary)",
            "url": "https://www.reddit.com/search/?q=freshbooks+alternative+freelancer",
            "text": "Freelancers in public threads say full accounting suites are too expensive and too heavy when all they need is invoicing and getting paid on time. "
                    "Several mention price increases and client limits on cheaper plans as the reason they looked for an alternative.",
        },
        {
            "title": "Reddit search: client won't pay invoice freelance developer (cached summary)",
            "url": "https://www.reddit.com/search/?q=client+not+paying+invoice+freelance+developer",
            "text": "Freelance developers describe late payment as the most stressful part of the job: chasing invoices 30, 60, 90 days overdue. "
                    "The frustrating part is the awkwardness of follow-up emails to a client they still want to work with. "
                    "Many say generic reminder emails get ignored and they don't know when to escalate or charge a late fee.",
        },
        {
            "title": "Hacker News search: freelance late payments (cached summary)",
            "url": "https://hn.algolia.com/?q=freelance%20late%20payment%20invoice&type=comment",
            "text": "Hacker News commenters who freelance recommend requiring deposits, milestone billing and clear late-fee clauses in contracts. "
                    "Some say the real problem is the client's accounts-payable workflow, not the reminder itself: invoices get stuck waiting on a PO number or an approver.",
        },
        {
            "title": "Hacker News search: invoicing tool for developers (cached summary)",
            "url": "https://hn.algolia.com/?q=invoicing%20tool%20developers&type=comment",
            "text": "Developers on Hacker News often build their own invoicing scripts or use plain templates because existing tools feel bloated. "
                    "There is interest in tools that integrate with GitHub, Stripe or time trackers so invoices are generated from work already logged. "
                    "Several would pay a small fee per recovered invoice rather than a monthly subscription.",
        },
        {
            "title": "Reddit search: late fee freelancer invoice (cached summary)",
            "url": "https://www.reddit.com/search/?q=late+fee+freelancer+invoice",
            "text": "Freelancers debate whether adding late fees damages client relationships. "
                    "A common view: fees work when stated upfront in the contract and enforced consistently, but solo workers feel uncomfortable enforcing them personally, so automation that applies policy neutrally is appealing.",
        },
    ],
}

_GENERIC_CACHE: list[dict[str, Any]] = [
    {
        "title": "Hacker News search: SaaS pricing frustrations (cached summary)",
        "url": "https://hn.algolia.com/?q=saas%20pricing%20subscription%20fatigue&type=comment",
        "text": "A recurring Hacker News theme is subscription fatigue: users resent monthly fees for tools they use occasionally and ask for one-time or usage-based pricing. "
                "Small teams say incumbent tools are built for larger companies and include features they never use.",
    },
    {
        "title": "Reddit search: niche software alternative (cached summary)",
        "url": "https://www.reddit.com/search/?q=simpler+alternative+software+small+business",
        "text": "Small business owners frequently ask for simpler alternatives to all-in-one suites. "
                "The common frustration is paying for a bloated workflow when they only need one core job done well for their specific niche.",
    },
    {
        "title": "Hacker News search: distribution for indie products (cached summary)",
        "url": "https://hn.algolia.com/?q=indie%20distribution%20channel%20community&type=comment",
        "text": "Indie founders on Hacker News say distribution is harder than building. "
                "Channels that work early are often communities where the target users already gather, integrations or marketplaces of a bigger platform, and partnerships with institutions that serve those users.",
    },
]


def get_demo(demo_id: str | None) -> dict[str, Any] | None:
    return next((d for d in DEMOS if d["id"] == demo_id), None)


def cached_docs(demo_id: str | None) -> list[dict[str, Any]]:
    items = _CACHE.get(demo_id or "", _GENERIC_CACHE)
    return [{**it, "source_type": "demo_cache"} for it in items]


def public_demos() -> list[dict[str, Any]]:
    return [dict(d) for d in DEMOS]
