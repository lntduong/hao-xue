<div align="center">
  <img src="public/icon.png" width="120" alt="HaoXue Logo">
  <h1>HaoXue - 好学 🐼</h1>
  <p><strong>Your Personal Chinese Learning Companion | Ứng dụng Học Tiếng Trung Cá nhân</strong></p>
</div>

---

## 🇺🇸 English

### 🌟 About HaoXue
**HaoXue** (好学 - "Eager to Learn" or "Easy to Learn") is a modern, lightweight, and highly personalized web application designed to help you master Mandarin Chinese. Built with Next.js and powered by a serverless Google Sheets backend, HaoXue serves as your ultimate digital notebook for Vocabulary, Dialogues, and Grammar, equipped with an intelligent Spaced Repetition System (SRS).

### ✨ Key Features
- **🧠 Spaced Repetition System (SRS)**: Anki-like flashcard algorithm with progressive intervals (1, 3, 7, 14, 30 days) to optimize memory retention. Includes Level filtering (HSK 1-6) and Daily Limits.
- **📚 Comprehensive Learning Modules**: Dedicated sections for Vocabulary, Dialogues, and Grammar notes.
- **🤖 Smart Import & Auto-Translate**: Bulk import via CSV with built-in AI auto-translation and Pinyin generation.
- **✍️ Hanzi Animations**: Stroke-by-stroke character writing animations.
- **🎮 Mini Games**: Interactive games to test both Pinyin-to-Meaning and Meaning-to-Pinyin recall.
- **🔒 PIN Protection**: Built-in middleware authentication (PIN-based) to keep your personal learning data secure when deployed publicly.
- **☁️ Serverless Backend**: Uses Google Apps Script and Google Sheets as a free, accessible, and easily manageable database.

### 🚀 Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, HeroUI, Lucide Icons.
- **Backend/Database**: Google Sheets (via Google Apps Script API).
- **Authentication**: Next.js Middleware.
- **Deployment**: Optimized for Vercel.

---

## 🇻🇳 Tiếng Việt

### 🌟 Về HaoXue
**HaoXue** (好学 - Hảo Học) là một ứng dụng web hiện đại, nhẹ nhàng và mang tính cá nhân hoá cao, được thiết kế để giúp bạn chinh phục Tiếng Trung. Được xây dựng trên nền tảng Next.js kết hợp với cơ sở dữ liệu miễn phí từ Google Sheets, HaoXue đóng vai trò như một cuốn sổ tay kỹ thuật số thông minh dành cho Từ vựng, Hội thoại và Ngữ pháp.

### ✨ Tính năng Nổi bật
- **🧠 Ôn tập Ngắt quãng (SRS)**: Thuật toán flashcard chuẩn mực (giống Anki) với các mốc thời gian giãn cách thông minh (1, 3, 7, 14, 30 ngày) giúp tối ưu hoá trí nhớ. Hỗ trợ lọc theo cấp độ HSK và giới hạn số từ mỗi phiên (Daily Limit).
- **📚 Phân hệ Học tập Đa dạng**: Bao gồm Từ vựng, Đoạn thoại giao tiếp và Sổ tay Ngữ pháp.
- **🤖 Nhập liệu Hàng loạt & Tự động Dịch**: Nhập hàng trăm từ vựng cùng lúc dạng CSV, tích hợp AI tự động dịch nghĩa và tự động tạo Pinyin.
- **✍️ Hoạt ảnh Chữ Hán**: Hiển thị thứ tự nét viết (Stroke order) trực quan cho từng chữ Hán.
- **🎮 Trò chơi Ôn luyện**: Mini game phản xạ trắc nghiệm ngẫu nhiên 2 chiều (Nhìn Hán/Pinyin đoán Nghĩa và ngược lại).
- **🔒 Bảo mật Mã PIN**: Hệ thống tường lửa (Middleware) giúp bảo vệ kho dữ liệu học tập cá nhân của bạn khỏi người lạ khi đưa lên mạng.
- **☁️ Máy chủ Google Sheets**: Sử dụng Google Apps Script làm API kết nối thẳng vào Google Sheets, giúp bạn quản lý dữ liệu dễ dàng như xài Excel.

### 🚀 Công nghệ Sử dụng
- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, HeroUI.
- **Backend/Database**: Google Sheets (thông qua Google Apps Script).
- **Bảo mật**: Next.js Middleware.
- **Triển khai (Deploy)**: Tối ưu hoá 100% cho Vercel.

---

## 🛠️ Setup & Deployment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lntduong/hao-xue.git
   cd hao-xue
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`.env.local`):**
   ```env
   NEXT_PUBLIC_API_URL=your_google_apps_script_url
   PIN_CODE=1712
   ```

4. **Run Locally:**
   ```bash
   npm run dev
   ```

5. **Deploy to Vercel:**
   Simply import the GitHub repository into Vercel. Don't forget to add the Environment Variables in your Vercel project settings!
