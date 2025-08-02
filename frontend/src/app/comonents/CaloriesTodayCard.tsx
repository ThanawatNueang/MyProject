import React, { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';

// Define TypeScript Interfaces for data structures
interface UserNutritionGoals {
  bmr: number;
  tdee: number;
  dailyCalorieGoal: number;
  macronutrients: {
    carbs: number;
    protein: number;
    fat: number;
  };
  macronutrientPercentages: {
    carbs: number;
    protein: number;
    fat: number;
  };
}

interface EatingHistoryEntry {
  id: string;
  food_name: string;
  consumed_at: string; // ISO 8601 string
  calculated_calories: number;
  calculated_fat: number;
  calculated_protein: number;
  calculated_carbohydrates: number;
  // Add other fields if necessary, e.g., custom_ingredients, notes
}

interface ApiResponse<T> {
  message: string;
  data: T;
}

const CaloriesTodayCard: React.FC = () => {
  const [userNutritionGoals, setUserNutritionGoals] = useState<UserNutritionGoals | null>(null);
  const [consumedTodayCalories, setConsumedTodayCalories] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // IMPORTANT: Replace with actual user ID from your authentication system (e.g., React Context, Redux)
  // For demonstration, we'll use a mock ID.
  const userId: string = 'user-example-uuid-001'; // This userId is for backend API calls if needed, but often derived from token.
                                         // The backend's authenticateToken middleware will use the token's ID.

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // --- 1. Fetch user nutrition goals from Backend ---
        // Endpoint: GET /api/users/me/nutrition-goals
        const goalsResponse = await fetch('http://localhost:3201/api/users/me/nutrition-goals', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Cookies (including jwtToken) are sent automatically by the browser for same-site requests
            // or with credentials: true for cross-origin requests if configured.
          },
          credentials: 'include', // Ensure cookies are sent with cross-origin requests
        });

        if (!goalsResponse.ok) {
          const errorData: ApiResponse<null> = await goalsResponse.json();
          throw new Error(errorData.message || 'Failed to fetch user nutrition goals.');
        }
        const goalsData: ApiResponse<UserNutritionGoals> = await goalsResponse.json();
        setUserNutritionGoals(goalsData.data); // Assuming response is { message: ..., data: goalsObject }

        // --- 2. Fetch eating history for today from Backend ---
        // Endpoint: GET /api/eating-history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
        const today: Date = new Date();
        const todayStart: string = format(startOfDay(today), 'yyyy-MM-dd');
        const todayEnd: string = format(endOfDay(today), 'yyyy-MM-dd');

        const historyResponse = await fetch(`http://localhost:3201/api/eating-history?startDate=${todayStart}&endDate=${todayEnd}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Ensure cookies are sent
        });

        if (!historyResponse.ok) {
          const errorData: ApiResponse<null> = await historyResponse.json();
          throw new Error(errorData.message || 'Failed to fetch eating history for today.');
        }
        const historyData: ApiResponse<EatingHistoryEntry[]> = await historyResponse.json();
        
        // Calculate total calories consumed today from the fetched history
        const totalCalories: number = historyData.data.reduce((acc: number, meal: EatingHistoryEntry) => acc + meal.calculated_calories, 0);
        setConsumedTodayCalories(parseFloat(totalCalories.toFixed(0)));

      } catch (err: any) { // Use 'any' for caught error if type is uncertain, or a more specific Error type
        console.error('Error fetching data for CaloriesTodayCard:', err);
        setError(err.message || 'ไม่สามารถดึงข้อมูลแคลอรี่วันนี้ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array: run once on mount (and not on userId change, as userId is mocked here)

  return (
    <div className="bg-yellow-100 p-6 rounded-lg shadow-md flex flex-col items-center justify-center min-w-[250px]">
      <p className="text-lg font-medium text-yellow-800">Calories Today</p>
      {loading ? (
        <p className="text-xl text-blue-500">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : userNutritionGoals ? (
        <>
          <p className="text-4xl font-bold text-yellow-900 mt-2">{consumedTodayCalories} kcal</p>
          <p className="text-sm text-gray-600 mt-1">Goal: {userNutritionGoals.dailyCalorieGoal.toFixed(0)} kcal</p>
          <p className={`text-sm font-semibold mt-1 ${consumedTodayCalories > userNutritionGoals.dailyCalorieGoal ? 'text-red-600' : 'text-green-600'}`}>
            {consumedTodayCalories > userNutritionGoals.dailyCalorieGoal ? 'เกินเป้าหมาย' : `เหลือ ${Math.max(0, userNutritionGoals.dailyCalorieGoal - consumedTodayCalories).toFixed(0)} kcal`}
          </p>
        </>
      ) : (
        <p className="text-sm text-red-500">ไม่สามารถคำนวณเป้าหมายได้ (ตรวจสอบข้อมูลผู้ใช้)</p>
      )}
    </div>
  );
};

export default CaloriesTodayCard;
