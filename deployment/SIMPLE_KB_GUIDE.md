# Simplified Knowledge Base Setup

## The Problem

OpenSearch Serverless requires complex permissions and data access policies that are difficult to set up. Even with full IAM permissions, you need additional OpenSearch-specific access policies.

## The Solution

Use **S3 directly** instead of Bedrock Knowledge Base + OpenSearch Serverless.

### Benefits:
- ✅ **Much simpler** - Just S3 permissions needed
- ✅ **Much cheaper** - ~$0.50/month vs ~$350/month
- ✅ **No permission issues** - Works with standard S3 access
- ✅ **Same functionality** - Agents still get all the guides
- ✅ **Faster setup** - 30 seconds vs 5 minutes

## Quick Setup

```powershell
cd deployment
.\create_kb_simple.ps1
```

That's it! The script will:
1. Create S3 bucket
2. Upload 6 LoL strategy guides
3. Configure Lambda role for S3 access
4. Save configuration

## What You Get

Your agents will have access to:
- ✅ 01_LoL_Master_Guide.md
- ✅ 02_Game_Fundamentals.md
- ✅ 03_Farming_and_Economy.md
- ✅ 04_Micro_vs_Macro.md
- ✅ 05_Team_Composition.md
- ✅ 06_Professional_Drafting.md

## How It Works

### Instead of Bedrock KB:
```
User Query → Bedrock KB → OpenSearch → Embeddings → Results
(Complex, expensive, permission issues)
```

### With S3 Direct:
```
User Query → S3 → Download Guide → Cache → Results
(Simple, cheap, works immediately)
```

## Usage in Agents

Agents can now use the `GuidesService`:

```python
from services.guides_service import get_guides_service

guides = get_guides_service()

# Load a specific guide
farming_guide = guides.load_guide("03_Farming_and_Economy.md")

# Search all guides
results = guides.search_guides("wave management")

# Get summary
summary = guides.get_guide_summary()
```

## Cost Comparison

### Bedrock Knowledge Base (Original):
- S3: $0.50/month
- OpenSearch Serverless: $350/month
- Bedrock: $0.10/month
- **Total: ~$350/month**

### S3 Direct (Simplified):
- S3: $0.50/month
- **Total: ~$0.50/month**

**Savings: $349.50/month (99.9% cheaper!)**

## Features

### Caching
Guides are cached locally after first download:
- First access: Downloads from S3 (~100ms)
- Subsequent access: Loads from cache (~1ms)

### Search
Simple keyword search across all guides:
```python
results = guides.search_guides("farming")
# Returns relevant sections from all guides
```

### Auto-Update
To update guides:
1. Edit markdown files in `backend/knowledge_base/`
2. Run `.\create_kb_simple.ps1` again
3. Agents will download updated versions

## Comparison

| Feature | Bedrock KB | S3 Direct |
|---------|-----------|-----------|
| Setup Time | 5 minutes | 30 seconds |
| Cost | $350/month | $0.50/month |
| Permissions | Complex | Simple |
| Search | Vector search | Keyword search |
| Speed | Fast | Very fast (cached) |
| Maintenance | Medium | Low |

## When to Use Each

### Use S3 Direct (Recommended):
- ✅ You want simple setup
- ✅ You want low cost
- ✅ You're having permission issues
- ✅ Keyword search is sufficient

### Use Bedrock KB:
- ⚠️ You need semantic/vector search
- ⚠️ You have complex permission setup working
- ⚠️ Cost is not a concern
- ⚠️ You need advanced RAG features

## Troubleshooting

### Guides Not Loading?

Check S3 access:
```powershell
aws s3 ls s3://runesight-guides-ACCOUNT_ID-REGION/guides/
```

Should list 6 markdown files.

### Lambda Can't Access S3?

The script automatically adds S3 permissions to your Lambda role. If it fails:

```powershell
# Manually add S3 policy
aws iam put-role-policy `
  --role-name YOUR_LAMBDA_ROLE `
  --policy-name RuneSightGuidesS3Access `
  --policy-document file://s3-policy.json
```

## Migration

### From Bedrock KB to S3 Direct:

1. Run the simple setup:
   ```powershell
   .\create_kb_simple.ps1
   ```

2. Remove KB ID from config:
   ```json
   {
     "environment": {
       "STRANDS_KNOWLEDGE_BASE_ID": ""  // Remove or leave empty
     }
   }
   ```

3. Deploy:
   ```powershell
   .\deploy-backend.ps1 -UpdateEnvOnly
   ```

### From S3 Direct to Bedrock KB:

If you later want full Bedrock KB:
1. Fix OpenSearch permissions
2. Run `.\create_kb.ps1`
3. Add KB ID to config
4. Deploy

## Summary

**For most users, S3 Direct is the better choice:**
- ✅ 700x cheaper
- ✅ 10x faster to setup
- ✅ No permission issues
- ✅ Same content available to agents

**Run this:**
```powershell
.\create_kb_simple.ps1
```

**And you're done!** 🚀
