import { redirect } from 'next/navigation';
import { getAdminSession } from '@/app/admin/auth/session';
import AdminLoginForm from './AdminLoginForm';

export default async function AdminLoginPage() {
    const session = await getAdminSession();

    if (session) {
        redirect('/admin');
    }

    return <AdminLoginForm />;
}
