'use client';

import { UserRole } from '@prisma/client';

import { RoleGate } from '@/components/auth/role-gate';
import { FormSuccess } from '@/components/form-success';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const AdminPage = () => {
  return (
    <Card className="w-[600px]">
      <CardHeader>
        <p className="text-center text-2xl font-semibold">🔑 Admin</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <RoleGate allowedRole={UserRole.ADMIN}>
          <FormSuccess message="You are allowed to see this content!" />
        </RoleGate>
      </CardContent>
    </Card>
  );
};

export default AdminPage;
