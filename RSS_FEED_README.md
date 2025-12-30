# RSS Feed & Social Media Automation

## Quick Start

The MSP M&A Marketplace now includes **three feed endpoints** for distributing listings to social media platforms via Make.com or N8N automation.

### Available Endpoints

| Endpoint | Format | Best For |
|----------|--------|----------|
| `/api/trpc/feed.getRSSFeed` | XML (RSS 2.0) | RSS readers, traditional automation |
| `/api/trpc/feed.getJSONFeed` | JSON (JSON Feed 1.1) | Modern platforms, custom integrations |
| `/api/trpc/feed.getLatestListings` | JSON (simple) | **Make.com/N8N webhooks** (recommended) |

## 1. RSS Feed Endpoint

**URL:** `https://msp.investments/api/trpc/feed.getRSSFeed`

Returns listings in standard RSS 2.0 format with extended content support.

### Parameters

```
?input={"limit":20,"baseUrl":"https://msp.investments"}
```

- `limit`: 1-100 (default: 20)
- `baseUrl`: Base URL for listing links (default: https://msp.investments)

### Example Usage

```bash
curl "https://msp.investments/api/trpc/feed.getRSSFeed?input={\"limit\":10}"
```

### Response Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>MSP M&A Marketplace - Latest Listings</title>
    <link>https://msp.investments</link>
    <description>Latest MSP listings available for acquisition</description>
    <item>
      <title>Growing MSP in Austin, TX</title>
      <link>https://msp.investments/listing/123</link>
      <guid isPermaLink="true">https://msp.investments/listing/123</guid>
      <pubDate>Mon, 15 Jan 2024 10:00:00 +0000</pubDate>
      <description>Well-established IT services company...</description>
      <content:encoded><![CDATA[
        <p><strong>MRR Range:</strong> $25k - $50k</p>
        <p><strong>EBITDA Multiple:</strong> 4.5x</p>
        <p><strong>Location:</strong> Austin, TX</p>
      ]]></content:encoded>
    </item>
  </channel>
</rss>
```

## 2. JSON Feed Endpoint

**URL:** `https://msp.investments/api/trpc/feed.getJSONFeed`

Returns listings in JSON Feed format (jsonfeed.org compliant).

### Parameters

```
?input={"limit":20,"baseUrl":"https://msp.investments"}
```

### Example Usage

```bash
curl "https://msp.investments/api/trpc/feed.getJSONFeed?input={\"limit\":10}"
```

### Response Example

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "MSP M&A Marketplace - Latest Listings",
  "home_page_url": "https://msp.investments",
  "feed_url": "https://msp.investments/api/feed/json",
  "description": "Latest MSP listings available for acquisition",
  "language": "en-US",
  "items": [
    {
      "id": "https://msp.investments/listing/123",
      "url": "https://msp.investments/listing/123",
      "title": "Growing MSP in Austin, TX",
      "summary": "Well-established IT services company...",
      "content_html": "<p><strong>MRR Range:</strong> $25k - $50k</p>...",
      "date_published": "2024-01-15T10:00:00.000Z",
      "date_modified": "2024-01-15T10:00:00.000Z",
      "tags": ["msp", "acquisition", "marketplace"]
    }
  ]
}
```

## 3. Latest Listings API (Recommended for Automation)

**URL:** `https://msp.investments/api/trpc/feed.getLatestListings`

Returns listings in simple JSON format optimized for webhook consumption.

### Parameters

```
?input={"limit":10,"sinceMinutesAgo":0}
```

- `limit`: 1-100 (default: 10)
- `sinceMinutesAgo`: Filter listings created in last N minutes (default: 0 = all)

### Example Usage

```bash
# Get latest 5 listings
curl "https://msp.investments/api/trpc/feed.getLatestListings?input={\"limit\":5}"

# Get listings from last 4 hours
curl "https://msp.investments/api/trpc/feed.getLatestListings?input={\"limit\":10,\"sinceMinutesAgo\":240}"
```

### Response Example

```json
{
  "success": true,
  "count": 2,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "listings": [
    {
      "id": 123,
      "title": "Growing MSP in Austin, TX",
      "description": "Well-established IT services company with strong client base",
      "mrrRange": "$25k - $50k",
      "ebitdaMultiple": "4.5x",
      "location": "Austin, TX",
      "url": "https://msp.investments/listing/123",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T09:00:00.000Z"
    },
    {
      "id": 124,
      "title": "Tech-Focused MSP in Seattle, WA",
      "description": "Cloud-native infrastructure specialist",
      "mrrRange": "$50k - $100k",
      "ebitdaMultiple": "5.0x",
      "location": "Seattle, WA",
      "url": "https://msp.investments/listing/124",
      "createdAt": "2024-01-15T10:15:00.000Z",
      "updatedAt": "2024-01-15T10:15:00.000Z"
    }
  ]
}
```

## Integration Guides

### Make.com Integration

See **FEED_AUTOMATION_GUIDE.md** for step-by-step instructions.

**Quick Setup:**
1. Create webhook trigger in Make.com
2. Add HTTP request to `https://msp.investments/api/trpc/feed.getLatestListings`
3. Add Twitter and LinkedIn modules
4. Configure post templates
5. Schedule to run every 4 hours

### N8N Integration

See **FEED_AUTOMATION_GUIDE.md** for step-by-step instructions.

**Quick Setup:**
1. Import N8N_WORKFLOW_TEMPLATE.json
2. Configure Twitter and LinkedIn credentials
3. Deploy workflow
4. Enable scheduling

### Manual Integration

You can also integrate the feeds manually:

```javascript
// Fetch latest listings
const response = await fetch(
  'https://msp.investments/api/trpc/feed.getLatestListings?input={"limit":5}'
);
const data = await response.json();

// Post to social media
data.listings.forEach(listing => {
  console.log(`New listing: ${listing.title} in ${listing.location}`);
  // Your social media posting logic here
});
```

## Post Templates

### X.com (Twitter) - 280 Characters

```
🚀 New MSP Available for Acquisition!

{{title}}
Location: {{location}}
MRR: {{mrrRange}}
Multiple: {{ebitdaMultiple}}

View details: {{url}}

#MSP #Acquisition #Technology
```

### LinkedIn - Professional Tone

```
📊 New MSP Listing on MSP M&A Marketplace

Company: {{title}}
Location: {{location}}
Monthly Recurring Revenue: {{mrrRange}}
EBITDA Multiple: {{ebitdaMultiple}}

Interested in acquiring this MSP? View the full listing and connect with the seller.

{{url}}

#MSPAcquisition #Technology #BusinessDevelopment
```

### LinkedIn - Investor Angle

```
💼 Investment Opportunity: Established MSP

We've just listed a well-performing MSP available for acquisition.

📍 Location: {{location}}
💰 MRR: {{mrrRange}}
📈 EBITDA Multiple: {{ebitdaMultiple}}

This is an excellent opportunity for investors looking to enter the managed services market or expand their portfolio.

Learn more: {{url}}

#MSP #Acquisition #Investment #Technology
```

## Best Practices

### Frequency

- **Every 4 hours:** Balanced approach, good for most audiences
- **Every 2 hours:** High-volume distribution
- **Daily digest:** Summarize top listings once per day
- **Real-time:** Webhook trigger when listing is published

### Content

- **Customize templates** to match your brand voice
- **Use relevant hashtags** for discoverability
- **Include call-to-action** (View details, Learn more)
- **Highlight key metrics** (MRR, EBITDA multiple, location)
- **Test with one listing** before enabling for production

### Engagement

- Monitor comments and messages for interested buyers
- Respond quickly to inquiries
- Share success stories of completed acquisitions
- Provide additional context about the marketplace

### Privacy

- Don't share confidential information in public posts
- Respect seller anonymity preferences
- Only post listings with "active" status
- Don't include personal contact information

## Troubleshooting

### No listings returned

**Check:**
- Are there active listings in the marketplace?
- Is the `limit` parameter set correctly?
- Is `sinceMinutesAgo` filtering out all results?

**Solution:**
```bash
# Debug: Check raw response
curl "https://msp.investments/api/trpc/feed.getLatestListings?input={\"limit\":100}"
```

### Connection timeout

**Check:**
- Is the marketplace server running?
- Is your internet connection stable?
- Is the URL correct?

**Solution:**
- Increase timeout in your automation platform
- Check marketplace status at https://msp.investments
- Verify endpoint URL in your configuration

### Invalid JSON response

**Check:**
- Are query parameters properly formatted?
- Is the `input` parameter valid JSON?

**Solution:**
```bash
# Validate JSON
echo '{"limit":10}' | jq .

# Test endpoint with valid parameters
curl "https://msp.investments/api/trpc/feed.getLatestListings?input={\"limit\":10}"
```

### Social media posting fails

**Check:**
- Are credentials correctly configured?
- Are there character limit issues?
- Are hashtags properly formatted?

**Solution:**
- Test posting manually first
- Check social media API limits
- Verify authentication tokens are valid
- Review post content for special characters

## Rate Limits

- **Public endpoints:** 100 requests per minute per IP
- **Authenticated endpoints:** 1,000 requests per minute per API key

For higher limits, contact support.

## API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid parameters) |
| 404 | Endpoint not found |
| 429 | Rate limit exceeded |
| 500 | Server error |

## Support

For questions or issues:

1. Check this guide and troubleshooting section
2. Review Make.com/N8N documentation
3. Contact support at support@msp.investments

## Examples

### Python Integration

```python
import requests
import json

# Fetch latest listings
url = "https://msp.investments/api/trpc/feed.getLatestListings"
params = {"input": json.dumps({"limit": 5})}
response = requests.get(url, params=params)
data = response.json()

# Process listings
for listing in data['listings']:
    print(f"Title: {listing['title']}")
    print(f"Location: {listing['location']}")
    print(f"MRR: {listing['mrrRange']}")
    print(f"URL: {listing['url']}\n")
```

### JavaScript Integration

```javascript
async function getLatestListings(limit = 5) {
  const input = { limit };
  const url = new URL('https://msp.investments/api/trpc/feed.getLatestListings');
  url.searchParams.append('input', JSON.stringify(input));
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.listings;
}

// Usage
const listings = await getLatestListings(10);
listings.forEach(listing => {
  console.log(`${listing.title} - ${listing.location}`);
});
```

### cURL Examples

```bash
# Get latest 10 listings
curl "https://msp.investments/api/trpc/feed.getLatestListings?input={\"limit\":10}"

# Get RSS feed
curl "https://msp.investments/api/trpc/feed.getRSSFeed?input={\"limit\":20}" \
  -H "Accept: application/rss+xml"

# Get JSON feed
curl "https://msp.investments/api/trpc/feed.getJSONFeed?input={\"limit\":20}" \
  -H "Accept: application/json"

# Get listings from last 2 hours
curl "https://msp.investments/api/trpc/feed.getLatestListings?input={\"limit\":10,\"sinceMinutesAgo\":120}"
```

## Changelog

### Version 1.0 (Current)
- RSS feed endpoint (RSS 2.0 format)
- JSON feed endpoint (JSON Feed 1.1 format)
- Latest listings API (simple JSON format)
- Make.com integration guide
- N8N integration guide
- Post templates for X.com and LinkedIn
- Rate limiting and error handling
- Comprehensive documentation

## Future Enhancements

- Webhook triggers for real-time distribution
- Filtering by category, location, revenue range
- Custom field mapping for automation platforms
- Analytics dashboard for distribution metrics
- Email digest functionality
- Slack integration
- Discord webhook support
