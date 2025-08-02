// ตัวอย่าง: src/pages/DashboardPage.js หรือ src/App.js
import React from 'react';
import CaloriesTodayCard from './comonents/CaloriesTodayCard'; // ปรับ path ให้ถูกต้องตามโครงสร้างของคุณ

function DashboardPage() {
  return (
    <div>
      {/* ส่วนอื่นๆ ของแดชบอร์ด */}
      <div className="p-4">
        <CaloriesTodayCard />
      </div>
      {/* ส่วนอื่นๆ ของแดชบอร์ด */}
    </div>
  );
}

export default DashboardPage;