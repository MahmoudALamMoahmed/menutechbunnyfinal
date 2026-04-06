import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  description?: string;
}

export default function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();

  return (
    <Card className="border-2 border-dashed border-muted-foreground/30">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{feature}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {description || 'هذه الميزة متاحة في الباقات المدفوعة. قم بترقية باقتك للاستفادة منها.'}
        </p>
        <Button onClick={() => navigate(`/${username}/subscription`)} className="flex items-center gap-2">
          <Crown className="w-4 h-4" />
          ترقية الباقة
        </Button>
      </CardContent>
    </Card>
  );
}
