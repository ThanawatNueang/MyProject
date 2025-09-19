// src/models/user-model.js
import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

const User = (sequelize) => {
  const userModel = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: true,
    },
    birthdate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    exerciseRoutine: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    exerciseFrequency: {
      type: DataTypes.ENUM(
        'no_exercise',
        'light_activity',
        'moderate_activity',
        'active',
        'very_active'
      ),
      allowNull: true,
    },
    fitnessGoal: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    bodyGoal: {
      type: DataTypes.ENUM('lose_weight', 'gain_weight', 'maintain_weight'),
      allowNull: true,
    },
    profilePicture: {
      type: DataTypes.STRING,
      defaultValue: 'default.jpg',
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  });

  return userModel;
};

export default User;
