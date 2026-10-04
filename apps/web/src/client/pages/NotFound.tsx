import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchXIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <ErrorState
      icon={SearchXIcon}
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      actions={<Button onClick={() => navigate('/dashboard')}>Go to Home</Button>} />);


}