// D:\Project\MyProject\backend\migrations\20250712131511-create-users-table.js
// ไม่ต้องมี import ใดๆ เพิ่มเติมสำหรับ Sequelize หรือ DataTypes ที่นี่
// Sequelize และ queryInterface จะถูกส่งมาเป็น argument ในฟังก์ชัน up/down

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.DataTypes.UUID, // <-- แก้ไขตรงนี้
      defaultValue: Sequelize.DataTypes.UUIDV4, // <-- แก้ไขตรงนี้
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: Sequelize.DataTypes.STRING, // <-- แก้ไขตรงนี้
      allowNull: false,
    },
    email: {
      type: Sequelize.DataTypes.STRING, // <-- แก้ไขตรงนี้
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.DataTypes.STRING, // <-- แก้ไขตรงนี้
      allowNull: false,
    },
    isVerified: {
      type: Sequelize.DataTypes.BOOLEAN, // <-- แก้ไขตรงนี้
      defaultValue: false,
      allowNull: false,
    },
    verificationToken: {
      type: Sequelize.DataTypes.STRING, // <-- แก้ไขตรงนี้
      allowNull: true,
    },
    passwordResetToken: {
      type: Sequelize.DataTypes.STRING, // <-- แก้ไขตรงนี้
      allowNull: true,
    },
    passwordResetExpires: {
      type: Sequelize.DataTypes.DATE, // <-- แก้ไขตรงนี้
      allowNull: true,
    },
    weight: {
      type: Sequelize.DataTypes.FLOAT, // <-- แก้ไขตรงนี้
      allowNull: true,
    },
    height: {
      type: Sequelize.DataTypes.FLOAT, // <-- แก้ไขตรงนี้ (หรือ INTEGER ถ้าต้องการ)
      allowNull: true,
    },
    gender: {
      type: Sequelize.DataTypes.ENUM('male', 'female'), // <-- แก้ไขตรงนี้
      allowNull: true,
    },
    birthdate: {
      type: Sequelize.DataTypes.DATEONLY, // <-- แก้ไขตรงนี้
      allowNull: true,
    },
    exerciseRoutine: {
      type: Sequelize.DataTypes.TEXT, // <-- แก้ไขตรงนี้
      allowNull: true,
    },
    exerciseFrequency: {
      type: Sequelize.DataTypes.ENUM( // <-- แก้ไขตรงนี้
        'no_exercise',
        'light_activity',
        'moderate_activity',
        'active',
        'very_active'
      ),
      allowNull: true,
    },
    fitnessGoal: {
      type: Sequelize.DataTypes.FLOAT, // <-- แก้ไขตรงนี้
      allowNull: true,
    },
    bodyGoal: {
      type: Sequelize.DataTypes.ENUM('lose_weight', 'gain_weight', 'maintain_weight'), // <-- แก้ไขตรงนี้
      allowNull: true,
    },
    profilePicture: {
      type: Sequelize.DataTypes.STRING, // <-- แก้ไขตรงนี้
      defaultValue: 'default.jpg',
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE, // <-- แก้ไขตรงนี้
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE, // <-- แก้ไขตรงนี้
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },{
      // เพิ่มการตั้งค่า charset และ collate ที่นี่
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
    });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('users');
}
