# Deployment Instructions for Geo-Lead Distribution System

## Prerequisites

1. **Google Cloud APIs to enable:**
   - Artifact Registry API
   - Google Kubernetes Engine API
   - IAM Credentials API

2. **IAM Roles to assign:**
   - Artifact Registry Administrator
   - Kubernetes Engine Developer
   - Workload Identity User (for GitHub Actions service account)

3. **Workload Identity Provider Setup:**
   - Create a Workload Identity Pool in Google Cloud IAM
   - Create a Workload Identity Provider linked to your GitHub repository
   - Bind the GitHub Actions service account to the Workload Identity Provider

4. **Environment Variables for GitHub Actions:**
   - `PROJECT_ID`: Your Google Cloud project ID
   - `GAR_LOCATION`: Artifact Registry location (e.g., `us-central1`)
   - `REPOSITORY`: Artifact Registry repository name
   - `GKE_CLUSTER`: Your GKE cluster name
   - `GKE_ZONE`: GKE cluster zone (e.g., `us-central1-a`)
   - `DEPLOYMENT_NAME`: Kubernetes deployment name (e.g., `geo-lead-distribution`)
   - `GCP_SA_KEY`: Base64 encoded JSON key of the Google Cloud service account with required permissions (stored as GitHub secret)

## Steps

1. **Enable required APIs:**

```bash
gcloud services enable artifactregistry.googleapis.com container.googleapis.com iamcredentials.googleapis.com
```

2. **Create and configure Artifact Registry:**

```bash
gcloud artifacts repositories create REPOSITORY --repository-format=docker --location=GAR_LOCATION
```

3. **Create GKE cluster:**

```bash
gcloud container clusters create GKE_CLUSTER --zone=GKE_ZONE
```

4. **Create service account and assign roles:**

```bash
gcloud iam service-accounts create github-actions-sa --display-name="GitHub Actions Service Account"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/container.developer"
```

5. **Set up Workload Identity Provider:**

- Follow [Google Cloud documentation](https://cloud.google.com/iam/docs/workload-identity-federation) to create a Workload Identity Pool and Provider for GitHub Actions.

6. **Configure GitHub repository secrets:**

- Add `GCP_SA_KEY` secret with the base64 encoded service account JSON key.

7. **Update `.github/workflows/deploy.yml` environment variables:**

- Replace placeholders with your actual project values.

8. **Push code to `main` branch:**

- The GitHub Actions workflow will build, push, and deploy your application automatically.

## Notes

- Ensure your Kubernetes secrets for database credentials, Stripe keys, SendGrid API keys, and Dialfire API keys are created in the cluster before deployment.
- Use `kubectl create secret generic` commands to create these secrets.
- Monitor the deployment status with:

```bash
kubectl get pods
kubectl logs deployment/geo-lead-distribution
```

- For troubleshooting, check GitHub Actions logs and GKE cluster logs.

## References

- [Google Artifact Registry](https://cloud.google.com/artifact-registry/docs/docker/quickstart)
- [Google Kubernetes Engine](https://cloud.google.com/kubernetes-engine/docs/how-to/deploying-a-container)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions for GCP](https://github.com/google-github-actions/setup-gcloud)
