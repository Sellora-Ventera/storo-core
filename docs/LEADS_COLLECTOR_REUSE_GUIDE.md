# Leads Collector Reuse Guide

This guide explains how to use the `leads-collector` edge function across multiple landing pages to collect and store leads in a centralized database.

## Overview

The `leads-collector` edge function stores all lead data in a Supabase database with the following structure:
- **email**: Primary contact email
- **whatsapp**: Optional WhatsApp number
- **domain**: Website domain where the lead was captured
- **project**: Project identifier to distinguish between different landing pages
- **source**: Type of lead capture (popup, exit-intent, contact-form, etc.)
- **user_agent**: Browser information
- **ip_address**: User's IP address
- **referrer**: Referring page
- **created_at**: Timestamp of lead capture

## Edge Function URL

```
https://wfthvovlhphnrodrqxqt.supabase.co/functions/v1/leads-collector
```

## How to Use in Your Landing Pages

### 1. Basic Implementation

Add this JavaScript code to any landing page form handler:

```javascript
const saveLead = async (leadData) => {
  try {
    const response = await fetch('https://wfthvovlhphnrodrqxqt.supabase.co/functions/v1/leads-collector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: leadData.email,
        whatsapp: leadData.whatsapp || null,
        domain: window.location.hostname,
        project: 'YOUR_PROJECT_NAME', // Change this for each landing page
        source: 'YOUR_SOURCE_TYPE'    // e.g., 'popup', 'contact-form', 'exit-intent'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save lead');
    }

    const result = await response.json();
    console.log('Lead saved:', result);
    return result;
  } catch (error) {
    console.error('Error saving lead:', error);
    throw error;
  }
};
```

### 2. Required Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Contact email address |
| `whatsapp` | string | No | WhatsApp number (can be null) |
| `domain` | string | Yes | Current website domain |
| `project` | string | Yes | Unique project identifier |
| `source` | string | Yes | Lead source type |

### 3. Project Names

Use descriptive project names to identify different landing pages:
- `storo-id` - Main Storo.id landing page
- `product-launch-2024` - Product launch page
- `webinar-signup` - Webinar registration page
- `ebook-download` - E-book download page

### 4. Source Types

Common source types to use:
- `popup` - Regular popup forms
- `exit-intent` - Exit intent popups
- `contact-form` - Contact forms
- `newsletter` - Newsletter signups
- `download` - File downloads
- `webinar` - Webinar registrations

### 5. Complete Example: React Contact Form

```jsx
import { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    whatsapp: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Save lead to database
      await fetch('https://wfthvovlhphnrodrqxqt.supabase.co/functions/v1/leads-collector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          whatsapp: formData.whatsapp,
          domain: window.location.hostname,
          project: 'my-landing-page', // Customize this
          source: 'contact-form'
        }),
      });

      // Show success message
      alert('Lead saved successfully!');
      
      // Reset form
      setFormData({ email: '', whatsapp: '', name: '' });
    } catch (error) {
      console.error('Error saving lead:', error);
      // Handle error gracefully
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
        required
      />
      <input
        type="tel"
        value={formData.whatsapp}
        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
        placeholder="WhatsApp (Optional)"
      />
      <button type="submit">Submit</button>
    </form>
  );
};
```

### 6. Vanilla JavaScript Example

```html
<form id="leadForm">
  <input type="email" name="email" placeholder="Email" required>
  <input type="tel" name="whatsapp" placeholder="WhatsApp (Optional)">
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  
  try {
    const response = await fetch('https://wfthvovlhphnrodrqxqt.supabase.co/functions/v1/leads-collector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.get('email'),
        whatsapp: formData.get('whatsapp') || null,
        domain: window.location.hostname,
        project: 'vanilla-js-page', // Customize this
        source: 'contact-form'
      }),
    });

    if (response.ok) {
      alert('Lead saved successfully!');
      e.target.reset();
    } else {
      throw new Error('Failed to save lead');
    }
  } catch (error) {
    console.error('Error saving lead:', error);
    alert('Error saving lead. Please try again.');
  }
});
</script>
```

### 7. Error Handling Best Practices

Always implement proper error handling:

```javascript
const saveLead = async (leadData) => {
  try {
    const response = await fetch('https://wfthvovlhphnrodrqxqt.supabase.co/functions/v1/leads-collector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save lead');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving lead:', error);
    
    // Still proceed with user's intended action (e.g., WhatsApp redirect)
    // Don't let database errors block the user experience
    
    return null; // or handle gracefully
  }
};
```

### 8. Viewing Your Leads

All leads are stored in the `leads` table in the Supabase database. You can:

1. **Query by project**: 
   ```sql
   SELECT * FROM leads WHERE project = 'your-project-name' ORDER BY created_at DESC;
   ```

2. **Query by domain**:
   ```sql
   SELECT * FROM leads WHERE domain = 'yourdomain.com' ORDER BY created_at DESC;
   ```

3. **Query by source**:
   ```sql
   SELECT * FROM leads WHERE source = 'popup' ORDER BY created_at DESC;
   ```

4. **Get statistics**:
   ```sql
   SELECT project, source, COUNT(*) as lead_count 
   FROM leads 
   GROUP BY project, source 
   ORDER BY lead_count DESC;
   ```

### 9. Response Format

The edge function returns:

**Success (200)**:
```json
{
  "success": true,
  "message": "Lead captured successfully",
  "leadId": "uuid-of-created-lead"
}
```

**Error (400/500)**:
```json
{
  "error": "Error message describing what went wrong"
}
```

### 10. Rate Limiting & Security

- The function includes CORS headers for cross-origin requests
- No authentication required (public endpoint)
- Input validation is performed on required fields
- IP address and user agent are automatically captured

### 11. Testing

Test the integration with:

```javascript
// Test function
const testLeadCapture = async () => {
  try {
    const result = await fetch('https://wfthvovlhphnrodrqxqt.supabase.co/functions/v1/leads-collector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        whatsapp: '1234567890',
        domain: 'test.com',
        project: 'test-project',
        source: 'test'
      }),
    });
    
    console.log('Test result:', await result.json());
  } catch (error) {
    console.error('Test failed:', error);
  }
};
```

## Support

For questions or issues with the leads-collector function, check the edge function logs in the Supabase dashboard or contact the development team.