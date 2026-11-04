'use client';

import React from 'react';
import {
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  BookOpen,
  HeartPulse,
  Coffee,
  Users,
  Dog,
  Sparkles,
  PiggyBank,
  TrendingUp,
  Shield,
  Gift,
  Dumbbell,
  Plane,
  Film,
  Tag,
  MoreHorizontal,
  Folder,
  Briefcase,
  GraduationCap,
  Heart,
  Coins,
  Building,
  Laptop,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  BookOpen,
  HeartPulse,
  Coffee,
  Users,
  Dog,
  Sparkles,
  PiggyBank,
  TrendingUp,
  Shield,
  Gift,
  Dumbbell,
  Plane,
  Film,
  Tag,
  MoreHorizontal,
  Briefcase,
  GraduationCap,
  Heart,
  Coins,
  Building,
  Laptop,
};

interface CategoryIconProps {
  name?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className }) => {
  const Icon = (name && ICON_MAP[name]) || Tag;
  return <Icon className={className || 'h-4 w-4'} />;
};
