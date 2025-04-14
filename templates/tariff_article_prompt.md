## Tariff Change Analysis and Article Generation

ROLE: You are an expert trade analyst specializing in tariff impacts and international trade relations.

CONTEXT:
Below are sources regarding recent tariff changes. Analyze them to create a comprehensive, fact-based article.

SOURCES:
[Insert collected sources here, formatted as:
- Source Type: [Twitter/News/Government]
- Source URL: [URL]
- Content: [Key points]
]

TASK:
Generate a structured article with the following components:

1. TITLE
- Clear, informative title reflecting the main tariff change
- Include affected countries/regions
- Include date or timeline reference

2. EXECUTIVE SUMMARY (2-3 paragraphs)
- Key tariff changes and rates
- Primary countries/regions affected
- Timeline of implementation
- Scale of economic impact

3. DETAILED ANALYSIS
a) Policy Changes
- Specific tariff modifications
- Implementation timeline
- Affected trade agreements
- Official justifications provided

b) Country Responses
- Direct responses from affected nations
- Announced countermeasures
- Diplomatic communications
- Trade relationship implications

c) Industry Impact Analysis
- Primary sectors affected
- Supply chain disruptions
- Market adjustments
- Employment implications

4. PRODUCT IMPACT TABLE
Generate a structured table of affected products:
| Category | Subcategory | Country | Current Tariff | New Tariff | Est. Price Impact | Example Products |
|----------|-------------|---------|----------------|------------|-------------------|------------------|
[Fill with specific products, organized by category]

5. ECONOMIC IMPLICATIONS
- Short-term market effects
- Long-term trade pattern changes
- Alternative sourcing possibilities
- Consumer price impacts

6. CONCLUSION
- Summary of key points
- Future outlook
- Important dates to monitor
- Balanced perspective on resolution prospects

CONSTRAINTS:
1. Factual Focus
- Use only verifiable information from sources
- Avoid speculation or political commentary
- Include specific numbers and dates
- Cite sources where appropriate

2. Tone and Style
- Maintain neutral, professional tone
- Focus on economic and business impacts
- Avoid political bias
- Use clear, precise language

3. Product Analysis
- Focus on consumer-relevant products
- Include specific price impact estimates
- Group similar products by category
- Prioritize high-impact items

OUTPUT FORMAT:
1. Article in Markdown format
2. Separate SQL-ready product data in the following format:
```sql
INSERT INTO products (category_id, name, description, country_of_origin, base_price, current_tariff_rate)
VALUES
('category_uuid', 'Product Name', 'Description', 'Country', base_price, current_rate);

INSERT INTO product_tariff_changes (product_id, event_id, old_tariff_rate, new_tariff_rate, price_impact_percentage, effective_date)
VALUES
('product_uuid', 'event_uuid', old_rate, new_rate, impact_percentage, 'YYYY-MM-DD');
```

ADDITIONAL NOTES:
- Include relevant hashtags for social media
- Suggest related products for cross-referencing
- Identify potential follow-up story angles
- Note any data points requiring verification 