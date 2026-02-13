// src/components/landing/PhoneForm.tsx
// Phone + name registration form with validation
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input } from '@/components/common';
import { useToast } from '@/components/common/Toast';
import { PHONE_REGEX } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ── Validation Schema ─────────────────────────────────────────────────────────

const phoneFormSchema = z.object({
  phone: z
    .string()
    .min(1, 'Vui lòng nhập số điện thoại')
    .regex(PHONE_REGEX, 'Số điện thoại không hợp lệ (VD: 0901234567)'),
  name: z
    .string()
    .min(1, 'Vui lòng nhập họ tên')
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ tên không quá 50 ký tự'),
});

type PhoneFormData = z.infer<typeof phoneFormSchema>;

interface PhoneFormProps {
  onRegister: (data: PhoneFormData) => Promise<{ success: boolean; message: string }>;
  isLoading?: boolean;
  className?: string;
}

export default function PhoneForm({ onRegister, isLoading = false, className }: PhoneFormProps) {
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: { phone: '', name: '' },
  });

  const onSubmit = async (data: PhoneFormData) => {
    const result = await onRegister(data);
    if (result.success) {
      addToast('success', result.message);
    } else {
      addToast('error', result.message);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn('w-full', className)}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">
          Nhập thông tin để chơi
        </h3>
        <p className="text-sm text-gray-500 mb-4 text-center">
          Đăng ký nhanh bằng số điện thoại
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            {...register('phone')}
            type="tel"
            inputMode="numeric"
            label="Số điện thoại"
            placeholder="0901234567"
            error={errors.phone?.message}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            }
            autoComplete="tel"
          />

          <Input
            {...register('name')}
            type="text"
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            error={errors.name?.message}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
            autoComplete="name"
          />

          <AnimatePresence>
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isLoading}
              className="mt-2"
            >
              🎮 Chơi ngay
            </Button>
          </AnimatePresence>
        </form>
      </div>
    </motion.section>
  );
}
