// ── 製品マスターデータ ──
// Message Center と Microsoft Learn から取得される製品カテゴリの静的定義
// 実際の MCP 連携時はこのリストを動的に拡充する

import { Product } from "./types";

export const PRODUCTS: Product[] = [
  // ── Azure ──
  { id: "azure", name: "Azure (全般)", family: "Azure", sources: ["message-center", "microsoft-learn"], description: "Azure プラットフォーム全般のアップデート" },
  { id: "azure-ai", name: "Azure AI Services", family: "Azure", sources: ["message-center", "microsoft-learn"], description: "Azure OpenAI, Cognitive Services, ML" },
  { id: "azure-compute", name: "Azure Compute", family: "Azure", sources: ["message-center", "microsoft-learn"], description: "VM, App Service, Functions, AKS" },
  { id: "azure-data", name: "Azure Data & Storage", family: "Azure", sources: ["message-center", "microsoft-learn"], description: "SQL, Cosmos DB, Storage, Synapse" },
  { id: "azure-networking", name: "Azure Networking", family: "Azure", sources: ["message-center", "microsoft-learn"], description: "VNet, Load Balancer, Front Door, CDN" },
  { id: "azure-security", name: "Azure Security", family: "Azure", sources: ["message-center", "microsoft-learn"], description: "Defender, Key Vault, Sentinel" },

  // ── Dynamics 365 ──
  { id: "d365-fo", name: "Dynamics 365 Finance & Operations", family: "Dynamics 365", sources: ["message-center", "microsoft-learn"], description: "Finance, SCM, Commerce, HR" },
  { id: "d365-ce", name: "Dynamics 365 Customer Engagement", family: "Dynamics 365", sources: ["message-center", "microsoft-learn"], description: "Sales, Customer Service, Field Service" },
  { id: "d365-bc", name: "Dynamics 365 Business Central", family: "Dynamics 365", sources: ["message-center", "microsoft-learn"], description: "中小企業向け ERP" },
  { id: "d365-ci", name: "Dynamics 365 Customer Insights", family: "Dynamics 365", sources: ["message-center", "microsoft-learn"], description: "Customer Insights - Data / Journeys" },

  // ── Microsoft 365 ──
  { id: "m365", name: "Microsoft 365 (全般)", family: "Microsoft 365", sources: ["message-center", "microsoft-learn"], description: "M365 プラットフォーム全般" },
  { id: "m365-teams", name: "Microsoft Teams", family: "Microsoft 365", sources: ["message-center", "microsoft-learn"], description: "Teams アプリ・プラットフォーム" },
  { id: "m365-copilot", name: "Microsoft 365 Copilot", family: "Microsoft 365", sources: ["message-center", "microsoft-learn"], description: "M365 Copilot / AI 機能" },
  { id: "m365-sharepoint", name: "SharePoint & OneDrive", family: "Microsoft 365", sources: ["message-center", "microsoft-learn"], description: "SharePoint, OneDrive, Lists" },

  // ── Power Platform ──
  { id: "power-platform", name: "Power Platform (全般)", family: "Power Platform", sources: ["message-center", "microsoft-learn"], description: "Power Platform 全般" },
  { id: "power-apps", name: "Power Apps", family: "Power Platform", sources: ["message-center", "microsoft-learn"], description: "Canvas / Model-driven アプリ" },
  { id: "power-automate", name: "Power Automate", family: "Power Platform", sources: ["message-center", "microsoft-learn"], description: "フロー自動化" },
  { id: "power-bi", name: "Power BI", family: "Power Platform", sources: ["message-center", "microsoft-learn"], description: "BI / レポーティング" },
  { id: "dataverse", name: "Microsoft Dataverse", family: "Power Platform", sources: ["message-center", "microsoft-learn"], description: "Dataverse プラットフォーム" },

  // ── Security ──
  { id: "security", name: "Microsoft Security", family: "Security", sources: ["message-center", "microsoft-learn"], description: "Defender, Sentinel, Entra, Purview" },
  { id: "entra", name: "Microsoft Entra", family: "Security", sources: ["message-center", "microsoft-learn"], description: "Entra ID, External ID, Permissions" },
];

/** 製品ファミリーのアイコン・カラー */
export const FAMILY_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  Azure: { icon: "☁️", color: "text-blue-600", bgColor: "bg-blue-50" },
  "Dynamics 365": { icon: "⚙️", color: "text-purple-600", bgColor: "bg-purple-50" },
  "Microsoft 365": { icon: "📎", color: "text-orange-600", bgColor: "bg-orange-50" },
  "Power Platform": { icon: "⚡", color: "text-green-600", bgColor: "bg-green-50" },
  Security: { icon: "🛡️", color: "text-red-600", bgColor: "bg-red-50" },
  Other: { icon: "📦", color: "text-gray-600", bgColor: "bg-gray-50" },
};
