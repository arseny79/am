# RSS Feed & Social Media Automation Guide

## Overview

The MSP M&A Marketplace provides multiple feed endpoints designed for integration with automation platforms like **Make.com** (formerly Integromat) and **N8N** to automatically distribute new listings to social media platforms (X.com and LinkedIn).

## Available Feed Endpoints

### 1. RSS Feed Endpoint
**URL:** `https://msp.investments/api/trpc/feed.getRSSFeed`

Returns listings in standard RSS 2.0 format with extended content support.

**Parameters:**
- `limit` (optional): Number of listings to include (1-100, default: 20)
- `baseUrl` (optional): Base URL for listing links (default: https://msp.investments)

**Response Format:** XML (RSS 2.0)

**Use Case:** Traditional RSS readers, general-purpose automation platforms

### 2. JSON Feed Endpoint
**URL:** `https://msp.investments/api/trpc/feed.getJSONFeed`

Returns listings in JSON Feed format (jsonfeed.org compliant).

**Parameters:**
- `limit` (optional): Number of listings to include (1-100, default: 20)
- `baseUrl` (optional): Base URL for listing links (default: https://msp.investments)

**Response Format:** JSON

**Use Case:** Modern automation platforms, custom integrations

### 3. Latest Listings API (Recommended for Make.com/N8N)
**URL:** `https://msp.investments/api/trpc/feed.getLatestListings`

Returns listings in simple JSON format optimized for webhook consumption.

**Parameters:**
- `limit` (optional): Number of listings to include (1-100, default: 10)
- `sinceMinutesAgo` (optional): Filter listings created in the last N minutes (default: 0 = all)

**Response Format:** JSON

**Example Response:**
```json
{
  "success": true,
  "count": 2,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "listings": [
    {
      "id": 123,
      "title": "Growing MSP in Austin, TX",
      "description": "Well-established IT services company...",
      "mrrRange": "$25k - $50k",
      "ebitdaMultiple": "4.5x",
      "location": "Austin, TX",
      "url": "https://msp.investments/listing/123",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

## Integration with Make.com

### Step 1: Create a New Scenario

1. Log in to your Make.com account
2. Click "Create a new scenario"
3. Search for and select "Webhooks" as the trigger module
4. Choose "Custom webhook"

### Step 2: Set Up the Webhook Trigger

1. Click "Add" to create a new webhook
2. Name it: "MSP Marketplace New Listings"
3. Copy the webhook URL provided by Make.com

### Step 3: Configure the HTTP Request

1. Add an "HTTP" module after the webhook trigger
2. Select "Make a request"
3. Configure:
   - **URL:** `https://msp.investments/api/trpc/feed.getLatestListings?input={"limit":5}`
   - **Method:** GET
   - **Headers:** (none required)

### Step 4: Parse the Response

1. Add a "JSON" module to parse the response
2. Map the response from the HTTP request

### Step 5: Add Social Media Actions

#### For X.com (Twitter):

1. Add "Twitter" module
2. Select "Create a tweet"
3. Configure the tweet content:

```
🚀 New MSP Available for Acquisition!

Title: {{listings[].title}}
Location: {{listings[].location}}
MRR: {{listings[].mrrRange}}
Multiple: {{listings[].ebitdaMultiple}}

View details: {{listings[].url}}

#MSP #Acquisition #Technology
```

#### For LinkedIn:

1. Add "LinkedIn" module
2. Select "Create a post"
3. Configure the post content:

```
📊 New MSP Listing on MSP M&A Marketplace

Company: {{listings[].title}}
Location: {{listings[].location}}
Monthly Recurring Revenue: {{listings[].mrrRange}}
EBITDA Multiple: {{listings[].ebitdaMultiple}}

Interested in acquiring this MSP? View the full listing and connect with the seller.

{{listings[].url}}

#MSPAcquisition #Technology #BusinessDevelopment
```

### Step 6: Schedule Automatic Checks

1. Add a "Schedule" module to trigger the scenario periodically
2. Set frequency: Every 4 hours (or your preferred interval)
3. Enable the scenario

## Integration with N8N

### Step 1: Create a New Workflow

1. Log in to your N8N instance
2. Click "New" to create a new workflow
3. Add a "Cron" node as the trigger

### Step 2: Configure the Cron Trigger

1. Set the cron expression: `0 */4 * * *` (every 4 hours)
2. Timezone: UTC

### Step 3: Add HTTP Request Node

1. Add an "HTTP Request" node
2. Configure:
   - **URL:** `https://msp.investments/api/trpc/feed.getLatestListings`
   - **Method:** GET
   - **Query Parameters:**
     - `input`: `{"limit":5}`

### Step 4: Add Twitter Node

1. Add a "Twitter" node
2. Select "Create a Tweet"
3. Configure credentials and tweet template:

```
🚀 New MSP Available for Acquisition!

{{$node["HTTP Request"].json.listings[0].title}}
Location: {{$node["HTTP Request"].json.listings[0].location}}
MRR: {{$node["HTTP Request"].json.listings[0].mrrRange}}

View: {{$node["HTTP Request"].json.listings[0].url}}

#MSP #Acquisition
```

### Step 5: Add LinkedIn Node

1. Add a "LinkedIn" node
2. Select "Create a Post"
3. Configure credentials and post template

### Step 6: Add Conditional Logic (Optional)

Add an "IF" node to check if listings exist before posting:

```
Condition: {{$node["HTTP Request"].json.count > 0}}
```

## API Authentication

The feed endpoints are **public** and do not require authentication. However, for security:

1. **Rate Limiting:** Consider implementing rate limiting in your automation platform
2. **IP Whitelisting:** Contact support to whitelist your automation platform's IP addresses
3. **API Keys:** For future versions, consider using API keys for enhanced security

## Example Automation Workflows

### Workflow 1: Daily Digest to LinkedIn

1. **Trigger:** Every day at 9 AM
2. **Action:** Fetch 10 latest listings
3. **Action:** Create LinkedIn post with top 3 listings
4. **Action:** Send summary email to team

### Workflow 2: Real-Time X.com Updates

1. **Trigger:** Every 30 minutes
2. **Action:** Check for new listings (sinceMinutesAgo: 30)
3. **Action:** If new listings found, post to X.com
4. **Action:** Log activity to spreadsheet

### Workflow 3: Multi-Channel Distribution

1. **Trigger:** New listing webhook (when seller publishes)
2. **Action:** Post to X.com with hashtags
3. **Action:** Post to LinkedIn with professional tone
4. **Action:** Post to company Slack channel
5. **Action:** Send email to subscribers

## Troubleshooting

### Issue: "No listings returned"

**Solution:** 
- Check that listings exist in the marketplace with "active" status
- Verify the `limit` parameter is set correctly
- Check the `sinceMinutesAgo` parameter isn't filtering out all results

### Issue: "Connection timeout"

**Solution:**
- Verify the endpoint URL is correct
- Check your internet connection
- Ensure the marketplace server is running
- Try increasing the timeout in your automation platform

### Issue: "Invalid JSON response"

**Solution:**
- Verify you're using the correct endpoint
- Check that query parameters are properly formatted
- Ensure the `input` parameter is valid JSON

### Issue: "Social media posting fails"

**Solution:**
- Verify social media credentials are correctly configured
- Check character limits for tweets (280 characters)
- Ensure hashtags are properly formatted
- Test with a manual post first

## Best Practices

1. **Frequency:** Check for new listings every 4-6 hours to avoid overwhelming your audience
2. **Content:** Customize the post template to match your brand voice
3. **Hashtags:** Use relevant hashtags (#MSP, #Acquisition, #Technology) for discoverability
4. **Testing:** Test the workflow with a single listing before enabling for production
5. **Monitoring:** Set up alerts if the automation fails
6. **Engagement:** Monitor comments and messages for interested buyers
7. **Privacy:** Don't share confidential listing information in public posts

## Advanced Integration: Webhook Trigger

For real-time distribution when listings are published, contact support to set up a webhook that triggers your automation immediately when a new listing is created.

**Webhook Event:** `listing.published`

**Payload:**
```json
{
  "event": "listing.published",
  "listing": {
    "id": 123,
    "title": "Growing MSP in Austin, TX",
    "location": "Austin, TX",
    "mrrRange": "$25k - $50k",
    "url": "https://msp.investments/listing/123"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

## Support

For questions or issues with feed integration:

1. Check this guide and troubleshooting section
2. Review Make.com/N8N documentation
3. Contact support at support@msp.investments

## API Rate Limits

- **Public endpoints:** 100 requests per minute per IP
- **Authenticated endpoints:** 1,000 requests per minute per API key

For higher limits, contact support.

## Changelog

### Version 1.0 (Current)
- RSS feed endpoint
- JSON feed endpoint
- Latest listings API
- Make.com integration guide
- N8N integration guide
