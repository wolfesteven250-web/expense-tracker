# SpendWise – AI-Assisted Expense Tracker

A React + Vite expense tracker built to match the uploaded lab brief.

## Features
- Add, edit and delete expenses
- Validation: amount must be greater than zero, category and date required, note limited to 120 characters
- Seeded categories plus custom category creation, rename and colour editing
- Prevents deleting a category while an expense uses it
- Saves expenses and categories in browser `localStorage`
- Monthly total, previous-month percentage comparison and daily average
- Category doughnut chart and six-month spending trend
- Export all expenses to CSV
- Responsive layout for desktop and mobile

## Run in VS Code
1. Extract `expense-tracker.zip`.
2. Open the extracted `expense-tracker` folder in VS Code.
3. Install Node.js (LTS) if it is not already installed.
4. Open **Terminal → New Terminal** in VS Code.
5. Run:

   ```bash
   npm install
   npm run dev
   ```

6. Open the local address printed in the terminal (usually `http://localhost:5173`).

## Notes
- Data is saved in the browser's local storage on the same browser/device. It is not uploaded to a server.
- Use the month picker to review another month.
- CSV export includes all saved expenses.
- To reset the sample app data, clear this site's local storage in browser developer tools.

## Project structure
```text
expense-tracker/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── styles.css
    └── hooks/
        └── useLocalStorage.js
```
