'use client';

import { User, Camera, Edit2, Phone, Mail, MapPin, Save, X, Lock, RefreshCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MessageModal from '@/app/components/MessageModal';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [avatarSalt, setAvatarSalt] = useState(0);
    const [imgError, setImgError] = useState(false);

    // User Data State
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        bio: '',
        gender: 'male',
        username: '',
        balance: 0,
        createdAt: ''
    });

    // Reset error when avatar is refreshed
    useEffect(() => {
        setImgError(false);
    }, [avatarSalt, userData.email]);

    // Password Update State
    const [passData, setPassData] = useState({ current: '', new: '' });
    const [msgModal, setMsgModal] = useState<{ isOpen: boolean; title: string; msg: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', msg: '', type: 'info' });

    // Robust Avatar Logic
    // Using v7 which is very stable.
    const gender = userData.gender?.toLowerCase() || 'male';
    const isFemale = gender === 'female' || gender === 'woman';

    // Explicit hair styles arrays
    const femaleHair = ['longHair', 'longHairBigHair', 'longHairBob', 'longHairBun', 'longHairCurly', 'longHairCurvy', 'longHairDreads', 'longHairFrida', 'longHairFro', 'longHairFroBand', 'longHairNotTooLong', 'longHairMiaWallace', 'longHairShavedSides', 'longHairStraight', 'longHairStraight2', 'longHairStraightStrand'];
    const maleHair = ['shortHair', 'shortHairDreads01', 'shortHairDreads02', 'shortHairFrizzle', 'shortHairShaggyMullet', 'shortHairShortCurly', 'shortHairShortFlat', 'shortHairShortRound', 'shortHairShortWaved', 'shortHairSides', 'shortHairTheCaesar', 'shortHairTheCaesarSidePart'];

    // Facial hair arrays
    const maleFacialHair = ['beardLight', 'beardMajestic', 'beardMedium', 'moustacheFancy', 'moustacheMagnum', 'stubbie', 'default']; // default might be none? Dicebear uses 'env' usually, but let's stick to explicit or blank.

    // Deterministic helper
    const getTrait = (arr: string[], seedString: string) => {
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % arr.length;
        return arr[index];
    };

    const avatarSeed = (userData.email || 'default') + avatarSalt;

    // Select traits based on gender
    const selectedTop = isFemale ? getTrait(femaleHair, avatarSeed) : getTrait(maleHair, avatarSeed);
    const selectedFacialHair = isFemale ? 'none' : getTrait(maleFacialHair, avatarSeed);

    // Clean Look Parameters
    const cleanParams = '&skinColor=f5d0b0,f1c27d,ffdbb4,edb98a&accessoriesProbability=0&clothing=shirtCrewNeck,shirtScoopNeck,shirtVNeck,collarAndSweater,graphicShirt,hoodie,overall&eyes=default,happy&mouth=default,smile&eyebrows=default,defaultNatural';

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&top=${selectedTop}&facialHair=${selectedFacialHair}${cleanParams}`;


    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.ok) {
                const data = await res.json();
                setUserData({
                    ...data,
                    name: data.name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    bio: data.bio || '',
                    gender: data.gender || 'male',
                    username: data.username || ''
                });
            }
        } catch (error) {
            console.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userData.name,
                    phone: userData.phone,
                    address: userData.address,
                    bio: userData.bio,
                    gender: userData.gender
                }),
            });

            if (res.ok) {
                setEditMode(false);
                setMsgModal({ isOpen: true, title: 'সফল!', msg: 'প্রোফাইল তথ্য আপডেট করা হয়েছে।', type: 'success' });
                window.dispatchEvent(new Event('balanceUpdate'));
            } else {
                setMsgModal({ isOpen: true, title: 'ব্যর্থ!', msg: 'আপডেট ব্যর্থ হয়েছে।', type: 'error' });
            }
        } catch (error) {
            setMsgModal({ isOpen: true, title: 'ত্রুটি', msg: 'সার্ভার সমস্যা।', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!passData.current || !passData.new) {
            setMsgModal({ isOpen: true, title: 'ত্রুটি', msg: 'সব ফিল্ড পূরণ করুন।', type: 'error' });
            return;
        }

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passData.current,
                    newPassword: passData.new
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setPassData({ current: '', new: '' });
                setMsgModal({ isOpen: true, title: 'সফল!', msg: data.message, type: 'success' });
            } else {
                setMsgModal({ isOpen: true, title: 'ব্যর্থ!', msg: data.error, type: 'error' });
            }
        } catch (error) {
            setMsgModal({ isOpen: true, title: 'ত্রুটি', msg: 'সার্ভার সমস্যা।', type: 'error' });
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading profile...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <MessageModal
                isOpen={msgModal.isOpen}
                onClose={() => setMsgModal(m => ({ ...m, isOpen: false }))}
                title={msgModal.title}
                message={msgModal.msg}
                type={msgModal.type}
            />

            {/* Page Title */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">ব্যবহারকারীর বিবরণ</h1>
                    <p className="text-sm text-slate-500">আপনার প্রোফাইল তথ্য এবং সেটিংস</p>
                </div>
                {!editMode ? (
                    <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                        <Edit2 className="w-4 h-4" /> এডিট প্রোফাইল
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setEditMode(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition"
                        >
                            <X className="w-4 h-4" /> বাতিল
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
                        >
                            {saving ? 'সংরক্ষণ হচ্ছে...' : <><Save className="w-4 h-4" /> সংরক্ষণ করুন</>}
                        </button>
                    </div>
                )}
            </div>

            {/* Top Card: Profile Image & Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-blue-500 to-purple-600 opacity-10"></div>
                <div className="mb-4 relative group">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden relative z-10">
                        {!imgError ? (
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-4xl font-bold text-slate-500 select-none">
                                {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>
                    {/* Refresh Button */}
                    <button
                        onClick={() => setAvatarSalt(s => s + 1)}
                        className="absolute bottom-0 right-0 z-20 p-2 bg-white rounded-full shadow-md text-slate-500 hover:text-blue-600 transition border border-slate-100"
                        title="Change Avatar Look"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>

                <div className="relative z-10">
                    <h2 className="text-xl font-bold text-slate-800">{userData.name || 'Set Your Name'}</h2>
                    <p className="text-slate-500 text-sm mb-4">{userData.email}</p>

                    <div className="flex flex-wrap gap-2 justify-center">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                            সক্রিয় অ্যাকাউন্ট
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                            ব্যালেন্স : ৳ {userData.balance?.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Personal Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
                    <h2 className="font-bold text-slate-800 mb-6 text-lg border-b pb-2">ব্যক্তিগত তথ্য</h2>
                    <div className="space-y-4">
                        <InfoInput
                            label="নাম"
                            value={userData.name}
                            isEditing={editMode}
                            onChange={(val) => setUserData({ ...userData, name: val })}
                            icon={User}
                        />
                        <InfoInput
                            label="ইউজারনেম"
                            value={userData.username}
                            isEditing={false} // Username cannot be changed
                            icon={Lock}
                            disabled={true}
                        />
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 block ml-1">লিঙ্গ</label>
                            {editMode ? (
                                <select
                                    value={userData.gender}
                                    onChange={(e) => setUserData({ ...userData, gender: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/30"
                                >
                                    <option value="male">পুরুষ</option>
                                    <option value="female">মহিলা</option>
                                    <option value="other">অন্যান্য</option>
                                </select>
                            ) : (
                                <div className="p-4 rounded-xl border border-slate-100 flex items-center gap-4 bg-slate-50/50">
                                    <div className="p-2 bg-slate-100 text-slate-400 rounded-lg">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <p className="font-semibold text-slate-700 capitalize">
                                        {userData.gender || 'Not set'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
                    <h2 className="font-bold text-slate-800 mb-6 text-lg border-b pb-2">যোগাযোগের তথ্য</h2>
                    <div className="space-y-4">
                        <InfoInput
                            label="ফোন নম্বর"
                            value={userData.phone}
                            isEditing={editMode}
                            onChange={(val) => setUserData({ ...userData, phone: val })}
                            icon={Phone}
                            placeholder="017xxxxxxxx"
                        />
                        <InfoInput
                            label="ঠিকানা"
                            value={userData.address}
                            isEditing={editMode}
                            onChange={(val) => setUserData({ ...userData, address: val })}
                            icon={MapPin}
                            isTextArea={true}
                            placeholder="আপনার ঠিকানা লিখুন..."
                        />
                        <InfoInput
                            label="বায়ো / সম্পর্কে"
                            value={userData.bio}
                            isEditing={editMode}
                            onChange={(val) => setUserData({ ...userData, bio: val })}
                            icon={Edit2}
                            isTextArea={true}
                            placeholder="নিজের সম্পর্কে কিছু লিখুন..."
                        />
                    </div>
                </div>

                {/* Password Update */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:col-span-2">
                    <h2 className="font-bold text-slate-800 mb-6 text-lg border-b pb-2">পাসওয়ার্ড পরিবর্তন</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 ml-1">বর্তমান পাসওয়ার্ড</label>
                            <input
                                type="password"
                                value={passData.current}
                                onChange={(e) => setPassData({ ...passData, current: e.target.value })}
                                placeholder="******"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 ml-1">নতুন পাসওয়ার্ড</label>
                            <input
                                type="password"
                                value={passData.new}
                                onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                                placeholder="******"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                        <button
                            onClick={handlePasswordUpdate}
                            className="py-3 px-6 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition shadow-lg shadow-slate-200 h-[46px]"
                        >
                            আপডেট করুন
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

function InfoInput({
    label,
    value,
    isEditing,
    onChange,
    icon: Icon,
    placeholder,
    isTextArea = false,
    disabled = false
}: {
    label: string,
    value: string,
    isEditing: boolean,
    onChange?: (val: string) => void,
    icon: any,
    placeholder?: string,
    isTextArea?: boolean,
    disabled?: boolean
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 block ml-1">{label}</label>
            {isEditing && !disabled ? (
                isTextArea ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange && onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-blue-50/30 resize-none"
                    />
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange && onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-blue-50/30"
                    />
                )
            ) : (
                <div className="p-4 rounded-xl border border-slate-100 flex items-center gap-4 bg-slate-50/50 min-h-[54px]">
                    <div className="p-2 bg-slate-100 text-slate-400 rounded-lg">
                        <Icon className="w-5 h-5" />
                    </div>
                    <p className={`font-semibold text-slate-700 ${!value && 'text-slate-400 italic'}`}>
                        {value || 'Not set'}
                    </p>
                </div>
            )}
        </div>
    );
}
