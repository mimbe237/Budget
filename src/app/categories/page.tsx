'use client';
import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <AppLayout>
      <Card>
        <CardHeader  className="flex flex-row items-center">
            <div className='grid gap-2'>
                <CardTitle className="font-headline">Categories</CardTitle>
                <CardDescription>
                Manage your expense and income categories.
                </CardDescription>
            </div>
            <div className="ml-auto gap-1">
                <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Category
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-muted-foreground">Category management is coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
