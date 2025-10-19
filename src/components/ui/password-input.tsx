'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  showStrength?: boolean;
  className?: string;
}

export function PasswordInput({ 
  value, 
  onChange, 
  placeholder = "••••••••", 
  error,
  showStrength = true,
  className = ""
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Faible', color: 'bg-red-500' };
    if (password.length < 8) return { strength: 2, label: 'Moyen', color: 'bg-orange-500' };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 4, label: 'Très fort', color: 'bg-green-500' };
    }
    return { strength: 3, label: 'Fort', color: 'bg-blue-500' };
  };

  const passwordStrength = getPasswordStrength(value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pr-10 ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-500" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </div>
      
      {showStrength && value.length > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  level <= passwordStrength.strength
                    ? passwordStrength.color
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600">
            Force du mot de passe : {passwordStrength.label}
          </p>
        </div>
      )}
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}