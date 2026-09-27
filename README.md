# Avtars — Personal Image Link & Photo Vault

**Avtars** is a minimalist, ultra-clean web application designed for storing, organizing, and managing image links and uploaded photos with zero clutter. Built with React, TypeScript, Tailwind CSS, Node.js/Express, MongoDB Atlas, and Cloudinary.

---

## 🌟 Key Features

1. **Dual-Vault Architecture**:
   - **Link Vault**: Store and organize external image links with live circular thumbnail previews, URL copying, and category filtering.
   - **Photos Gallery**: Upload image files directly to **Cloudinary** or paste image URLs, displayed in a gorgeous **masonry grid layout**. Click any image to instantly copy its URL to your clipboard.

2. **Independent Page Categories**:
   - Categories are completely decoupled between the Link Vault and Photos Gallery. Adding a category in one page does not bleed into the other.
   - Includes "+ Add category..." quick-add modals for each section.

3. **Secure Authentication & Persistence**:
   - Fully functional Sign In & Registration system backed by **MongoDB Atlas**.
   - Password update settings modal.

4. **JSON Export**:
   - Export your saved links or gallery photos as formatted `.json` files for any category or "All" view with a single click.

5. **Minimalist Design**:
   - Flat white aesthetic with subtle hairline borders, reduced shadows, and clean skeleton loading states during data fetching.

---

## 🚀 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, Vite middleware
- **Database**: MongoDB Atlas
- **Media Storage**: Cloudinary SDK

---

## 👨‍💻 Author & Developer

All rights reserved © **[Avdhesh Kumar](https://avdheshh-portfolio.netlify.app/)**
