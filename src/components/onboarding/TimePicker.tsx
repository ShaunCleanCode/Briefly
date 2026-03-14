'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Clock, Sun, Coffee, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TimePreset {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TIME_PRESETS: TimePreset[] = [
  { 
    value: '07:00', 
    label: '아침', 
    icon: <Sun className="w-5 h-5" />,
    description: '출근 전에'
  },
  { 
    value: '12:00', 
    label: '점심', 
    icon: <Coffee className="w-5 h-5" />,
    description: '점심시간에'
  },
  { 
    value: '18:00', 
    label: '저녁', 
    icon: <Moon className="w-5 h-5" />,
    description: '퇴근 후에'
  },
];

interface TimePickerProps {
  defaultValue?: string;
  minTime?: string;
  maxTime?: string;
  onSubmit: (time: string) => void;
  disabled?: boolean;
}

export function TimePicker({
  defaultValue = '07:00',
  minTime = '05:00',
  maxTime = '22:00',
  onSubmit,
  disabled = false,
}: TimePickerProps) {
  const [selectedTime, setSelectedTime] = useState(defaultValue);
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetSelect = useCallback((time: string) => {
    setSelectedTime(time);
    setShowCustom(false);
  }, []);

  const handleCustomTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(e.target.value);
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(selectedTime);
  }, [selectedTime, onSubmit]);

  const isPresetSelected = TIME_PRESETS.some((p) => p.value === selectedTime);

  return (
    <div className="w-full space-y-6">
      {/* Presets */}
      <div className="grid grid-cols-3 gap-3">
        {TIME_PRESETS.map((preset) => {
          const isSelected = selectedTime === preset.value && !showCustom;
          
          return (
            <motion.button
              key={preset.value}
              onClick={() => handlePresetSelect(preset.value)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4 rounded-xl',
                'bg-white dark:bg-slate-800 border-2 transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                isSelected 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              whileHover={disabled ? undefined : { scale: 1.02 }}
              whileTap={disabled ? undefined : { scale: 0.98 }}
            >
              <div className={cn(
                'p-2 rounded-full',
                isSelected 
                  ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              )}>
                {preset.icon}
              </div>
              <div className="text-center">
                <div className={cn(
                  'font-semibold',
                  isSelected 
                    ? 'text-indigo-900 dark:text-indigo-100'
                    : 'text-slate-900 dark:text-white'
                )}>
                  {preset.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {preset.value}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Custom time option */}
      <div className="space-y-3">
        <button
          onClick={() => setShowCustom(true)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
            'text-sm font-medium transition-colors',
            showCustom || !isPresetSelected
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          )}
        >
          <Clock className="w-4 h-4" />
          다른 시간 선택
        </button>

        {(showCustom || !isPresetSelected) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center justify-center"
          >
            <Input
              type="time"
              value={selectedTime}
              onChange={handleCustomTimeChange}
              min={minTime}
              max={maxTime}
              disabled={disabled}
              className={cn(
                'w-40 text-center text-lg font-mono rounded-xl',
                'border-2 border-indigo-500 bg-white dark:bg-slate-800',
                'focus:ring-2 focus:ring-indigo-500/20'
              )}
            />
          </motion.div>
        )}
      </div>

      {/* Timezone note */}
      <p className="text-xs text-center text-slate-400 dark:text-slate-500">
        한국 시간 (KST) 기준입니다
      </p>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={disabled}
          className={cn(
            'px-8 py-3 rounded-xl',
            'bg-indigo-600 hover:bg-indigo-700 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          계속하기
        </Button>
      </div>
    </div>
  );
}
