# Knowledge Base Deployment Guide

Quick guide for setting up AWS Bedrock Knowledge Base for RuneSight.

## Prerequisites

- AWS CLI installed and configured
- AWS account with Bedrock access enabled
- Appropriate IAM permissions

## Quick Setup

### Windows (PowerShell)

```powershell
cd backend/knowledge_base
.\create_kb.ps1
```

### Linux/Mac (Bash)

```bash
cd backend/knowledge_base
chmod +x create_kb.sh
./create_kb.sh
```

## What the Script Does

1. **Creates S3 Bucket** - For knowledge base storage
2. **Sets up IAM Role** - With necessary permissions
3. **Creates OpenSearch Collection** - Vector store for embeddings
4. **Creates Knowledge Base** - Bedrock KB with Titan embeddings
5. **Saves Configuration** - To `../config/knowledge_base.json`

## After Setup

1. **Copy the Knowledge Base ID** from the script output

2. **Add to your `.env` file:**
   ```bash
   STRANDS_KNOWLEDGE_BASE_ID=your-kb-id-here
   KB_MIN_SCORE=0.5
   KB_MAX_RESULTS=5
   ```

3. **Test the setup:**
   ```powershell
   # Windows
   python example_kb_agent.py --demo
   
   # Linux/Mac
   python3 example_kb_agent.py --demo
   ```

## Configuration File

The script creates `../config/knowledge_base.json`:

```json
{
  "knowledge_base_id": "KB123ABC",
  "collection_id": "collection-id",
  "bucket_name": "runesight-kb-123456-region",
  "role_arn": "arn:aws:iam::123456:role/RuneSightKnowledgeBaseRole",
  "region": "eu-central-1",
  "embedding_model": "arn:aws:bedrock:region::foundation-model/amazon.titan-embed-text-v2:0"
}
```

## Troubleshooting

### AWS CLI Not Found

**Windows:**
```powershell
# Install AWS CLI
winget install Amazon.AWSCLI
# Or download from: https://aws.amazon.com/cli/
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Mac:**
```bash
brew install awscli
```

### AWS Credentials Not Configured

```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., eu-central-1)
# - Default output format (json)
```

### Bedrock Not Available in Region

Bedrock is available in these regions:
- us-east-1 (N. Virginia)
- us-west-2 (Oregon)
- eu-central-1 (Frankfurt)
- ap-northeast-1 (Tokyo)
- ap-southeast-1 (Singapore)

Change region in script or set:
```bash
export AWS_REGION=us-east-1  # Linux/Mac
$env:AWS_REGION="us-east-1"  # Windows PowerShell
```

### Permission Errors

Ensure your AWS user/role has these permissions:
- `bedrock:*`
- `s3:*`
- `iam:CreateRole`
- `iam:CreatePolicy`
- `iam:AttachRolePolicy`
- `aoss:*` (OpenSearch Serverless)

### Collection Creation Fails

OpenSearch Serverless might not be available in all regions. Try:
1. Use a different region
2. Check AWS Service Health Dashboard
3. Verify account limits

### Knowledge Base Creation Fails

Common issues:
1. **IAM role not propagated** - Wait 30 seconds and retry
2. **Collection not active** - Wait for collection to be active
3. **Embedding model not available** - Check model availability in region

## Manual Cleanup

If you need to delete resources:

```powershell
# Windows PowerShell
$KB_ID = "your-kb-id"
$COLLECTION_ID = "your-collection-id"
$BUCKET_NAME = "your-bucket-name"
$REGION = "eu-central-1"

# Delete Knowledge Base
aws bedrock-agent delete-knowledge-base --knowledge-base-id $KB_ID --region $REGION

# Delete OpenSearch Collection
aws opensearchserverless delete-collection --id $COLLECTION_ID --region $REGION

# Empty and delete S3 bucket
aws s3 rm "s3://$BUCKET_NAME" --recursive
aws s3 rb "s3://$BUCKET_NAME"

# Delete IAM policy and role
aws iam detach-role-policy --role-name RuneSightKnowledgeBaseRole --policy-arn "arn:aws:iam::ACCOUNT_ID:policy/RuneSightKnowledgeBasePolicy"
aws iam delete-policy --policy-arn "arn:aws:iam::ACCOUNT_ID:policy/RuneSightKnowledgeBasePolicy"
aws iam delete-role --role-name RuneSightKnowledgeBaseRole
```

## Cost Estimate

Approximate monthly costs (light usage):
- **S3 Storage:** $0.023/GB (~$0.50/month for 20GB)
- **OpenSearch Serverless:** $0.24/OCU-hour (~$350/month for 2 OCUs)
- **Bedrock Embeddings:** $0.0001/1K tokens (~$1/month for 10M tokens)
- **Total:** ~$350-400/month

**Note:** OpenSearch Serverless is the main cost driver. Consider using Amazon Aurora or Pinecone for lower costs.

## Alternative Vector Stores

If OpenSearch Serverless is too expensive, you can use:

### Amazon Aurora (PostgreSQL with pgvector)
- Lower cost (~$50-100/month)
- Requires more setup
- Good for production

### Pinecone
- Serverless pricing
- Easy to set up
- Good for development

See AWS Bedrock documentation for configuration details.

## Next Steps

1. ✅ Run setup script
2. ✅ Add KB ID to `.env`
3. ✅ Test with example agent
4. ✅ Integrate into your agents
5. ✅ Start storing insights!

## Support

For issues:
- Check CloudWatch logs
- Review AWS Bedrock console
- Verify IAM permissions
- Test with example agent first

## Resources

- [AWS Bedrock Knowledge Base Docs](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- [OpenSearch Serverless Docs](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless.html)
- [Strands Agents Documentation](https://docs.strands.ai/)
