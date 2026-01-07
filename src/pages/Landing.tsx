import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollMorphHero from '../components/ui/ScrollMorphHero';

export function Landing() {
  const navigate = useNavigate();

  const handleScrollComplete = useCallback(() => {
    setTimeout(() => {
      navigate('/home');
    }, 500);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50">
      <ScrollMorphHero onScrollComplete={handleScrollComplete} />
    </div>
  );
}
