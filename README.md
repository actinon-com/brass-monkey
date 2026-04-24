# Brass-Monkey 🐒

**Brass-Monkey** is a powerful Gemini CLI extension that provides a secure, intelligent bridge between Gemini and Odoo instances. It enables AI agents to interact with Odoo's CRM, ERP, and business logic with high precision and security.

## 🌟 Key Features

- **TypeScript Implementation:** Modern, type-safe bridge to Odoo's XML-RPC/JSON-RPC APIs.
- **Domain-Specific Skills:** Specialized guidance for Sales, Invoicing, Inventory, and more.
- **Flexible Auth:** Seamlessly switch between Odoo native login and Google OAuth2.
- **Intelligent Discovery:** Automated mapping of Odoo models, views, and business processes.
- **Surgical Records Management:** Optimized tools for high-fidelity record manipulation.

## 🏗️ Architecture

Brass-Monkey follows the Gemini CLI extension model:
- **Tools:** Actionable functions for Odoo record and metadata operations.
- **Skills:** Expert procedural guidance for specific Odoo modules.
- **Schemas:** Strict data validation using Zod.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- An active Odoo instance (v14+)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/brass-monkey.git
cd brass-monkey

# Install dependencies
npm install
```

## 🔐 Security

Brass-Monkey is designed with a "Security First" philosophy:
- **Production Write Guards:** Prevents accidental modifications to live databases.
- **Credential Protection:** Zero-log policy for sensitive data.
- **OAuth Integration:** Secure authentication via Google Workspace.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
