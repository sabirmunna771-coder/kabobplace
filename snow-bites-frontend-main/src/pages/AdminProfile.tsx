import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Eye as LuEye,
  EyeOff as LuEyeOff,
  KeyRound,
  Lock as LuLock,
  Mail as LuMail,
  Phone as LuPhone,
  Shield,
  Sparkles,
  Upload,
  User as LuUser,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/context/AuthContext";
import { changeMyPassword, getApiAssetUrl, updateMyProfile, uploadMyProfileAvatar } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ModalKey = "personal" | "photo" | "password" | null;

const previewSize = 256;

function getInitials(name?: string | null) {
  return (name ?? "Kabob Places")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "KP";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^[+()\-\s\d]{7,32}$/.test(value);
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ["Very weak", "Weak", "Fair", "Strong", "Excellent"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
  return {
    score,
    label: labels[score],
    color: colors[score],
  };
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

const AdminProfile = () => {
  const { token, user, logout, setAuthenticatedUser } = useAuth();
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [avatarSource, setAvatarSource] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const [avatarFileName, setAvatarFileName] = useState<string>("");
  const [avatarSize, setAvatarSize] = useState({ width: previewSize, height: previewSize });
  const [avatarError, setAvatarError] = useState<string>("");
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    setPersonalForm({
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    });
  }, [user?.fullName, user?.email, user?.phone]);

  const avatarUrl = getApiAssetUrl(user?.profilePictureUrl);
  const initials = getInitials(user?.fullName);
  const joinedLabel = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  const personalErrors = useMemo(() => ({
    fullName: personalForm.fullName.trim().length >= 2 ? "" : "Full name must be at least 2 characters.",
    email: isValidEmail(personalForm.email.trim()) ? "" : "Enter a valid email address.",
    phone: !personalForm.phone.trim() || isValidPhone(personalForm.phone.trim()) ? "" : "Use 7 to 32 digits and common phone symbols.",
  }), [personalForm]);

  const personalHasChanges = useMemo(
    () => personalForm.fullName.trim() !== (user?.fullName ?? "")
      || personalForm.email.trim().toLowerCase() !== (user?.email ?? "")
      || personalForm.phone.trim() !== (user?.phone ?? ""),
    [personalForm, user?.email, user?.fullName, user?.phone],
  );

  const passwordStrength = useMemo(() => getPasswordStrength(passwordForm.newPassword), [passwordForm.newPassword]);
  const passwordErrors = useMemo(() => ({
    currentPassword: passwordForm.currentPassword.length >= 8 ? "" : "Current password is required.",
    newPassword: passwordForm.newPassword.length >= 8 ? "" : "New password must be at least 8 characters.",
    confirmPassword: passwordForm.confirmPassword === passwordForm.newPassword ? "" : "Passwords do not match.",
  }), [passwordForm]);

  const canSavePersonal = Object.values(personalErrors).every((value) => !value) && personalHasChanges;
  const canSavePassword = Object.values(passwordErrors).every((value) => !value) && passwordForm.newPassword.length > 0 && passwordStrength.score >= 2;

  const basePreviewScale = useMemo(
    () => Math.max(previewSize / avatarSize.width, previewSize / avatarSize.height),
    [avatarSize.height, avatarSize.width],
  );
  const renderedPreviewWidth = avatarSize.width * basePreviewScale * avatarZoom;
  const renderedPreviewHeight = avatarSize.height * basePreviewScale * avatarZoom;
  const previewLeft = (previewSize - renderedPreviewWidth) / 2 + avatarOffsetX;
  const previewTop = (previewSize - renderedPreviewHeight) / 2 + avatarOffsetY;

  const openPersonalModal = () => {
    setPersonalForm({
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    });
    setActiveModal("personal");
  };

  const openPasswordModal = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPassword({ current: false, next: false, confirm: false });
    setActiveModal("password");
  };

  const openPhotoModal = () => {
    setAvatarError("");
    setAvatarSource(avatarUrl);
    setAvatarZoom(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
    setAvatarFileName("");
    setAvatarSize({ width: previewSize, height: previewSize });
    setActiveModal("photo");
  };

  const handleAvatarSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Select a PNG, JPEG, or WEBP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 2MB.");
      return;
    }

    try {
      const nextDataUrl = await fileToDataUrl(file);
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.width, height: image.height });
        image.onerror = () => reject(new Error("Unable to load the image for cropping."));
        image.src = nextDataUrl;
      });

      setAvatarSource(nextDataUrl);
      setAvatarFileName(file.name);
      setAvatarSize(dimensions);
      setAvatarZoom(1);
      setAvatarOffsetX(0);
      setAvatarOffsetY(0);
      setAvatarError("");
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Unable to load the selected image.");
    }
  };

  const buildCroppedAvatar = () => {
    if (!avatarSource) {
      throw new Error("Select an image before saving.");
    }

    const image = new Image();
    image.src = avatarSource;

    return new Promise<string>((resolve, reject) => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const outputSize = 512;
        canvas.width = outputSize;
        canvas.height = outputSize;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Unable to create image canvas."));
          return;
        }

        const baseScale = Math.max(outputSize / image.width, outputSize / image.height);
        const renderWidth = image.width * baseScale * avatarZoom;
        const renderHeight = image.height * baseScale * avatarZoom;
        const offsetScale = outputSize / previewSize;
        const drawX = (outputSize - renderWidth) / 2 + avatarOffsetX * offsetScale;
        const drawY = (outputSize - renderHeight) / 2 + avatarOffsetY * offsetScale;

        context.clearRect(0, 0, outputSize, outputSize);
        context.drawImage(image, drawX, drawY, renderWidth, renderHeight);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error("Unable to process the selected image."));
    });
  };

  const savePersonalInformation = async () => {
    if (!token || !user || !canSavePersonal) return;
    setIsSaving(true);
    try {
      const response = await updateMyProfile(token, {
        fullName: personalForm.fullName.trim(),
        email: personalForm.email.trim().toLowerCase(),
        phone: personalForm.phone.trim(),
      });
      setAuthenticatedUser(response.user);
      toast.success(response.message || "Profile updated successfully!");
      setActiveModal(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const savePassword = async () => {
    if (!token || !canSavePassword) return;
    setIsSaving(true);
    try {
      const response = await changeMyPassword(token, passwordForm);
      toast.success(response.message || "Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setActiveModal(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveAvatar = async () => {
    if (!token || !avatarSource) {
      setAvatarError("Select and crop an image before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const croppedImage = await buildCroppedAvatar();
      const response = await uploadMyProfileAvatar(token, croppedImage);
      setAuthenticatedUser(response.user);
      toast.success(response.message || "Profile updated successfully!");
      setActiveModal(null);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Unable to update profile photo.");
      toast.error(error instanceof Error ? error.message : "Unable to update profile photo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-bg-3 to-bg-2 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--glow3))_0%,transparent_50%)]" />
        
        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Profile Info */}
            <div className="flex items-start gap-4 lg:items-center">
              <div className="relative size-24 lg:size-28 flex-shrink-0 overflow-hidden rounded-xl border border-border shadow-lg">
                {avatarUrl && !avatarLoadFailed ? (
                  <img
                    src={avatarUrl}
                    alt={user?.fullName ?? "Profile"}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent text-3xl font-bold text-[#071F07]">
                    {initials}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{user?.fullName ?? "Admin User"}</h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-[0.7rem] font-bold text-emerald-300 uppercase tracking-wide">
                    <CheckCircle2 size={14} />
                    Secure
                  </span>
                </div>
                <p className="text-sm text-txt-3 mb-1">{user?.role === "ADMIN" ? "Administrator" : user?.role ?? "User"} • Full operational access</p>
                <p className="text-xs text-txt-4">Joined {joinedLabel}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={openPhotoModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-glass-2 font-semibold text-sm text-foreground hover:bg-glass-3 transition-colors"
              >
                <Upload size={16} />
                Photo
              </button>
              <button
                onClick={openPersonalModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-glass-2 font-semibold text-sm text-foreground hover:bg-glass-3 transition-colors"
              >
                <LuUser size={16} />
                Profile
              </button>
              <button
                onClick={openPasswordModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-glass-2 font-semibold text-sm text-foreground hover:bg-glass-3 transition-colors"
              >
                <KeyRound size={16} />
                Password
              </button>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-primary to-accent font-bold text-sm text-[#071F07] hover:shadow-lg transition-all"
              >
                <LuLock size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Personal Information */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-gradient-to-br from-bg-3 to-bg-2 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
              <LuUser size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Personal Info</h3>
              <p className="text-[0.7rem] text-txt-4">Identity & contact details</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-glass-2 p-3.5">
              <div className="text-[0.7rem] font-bold text-txt-4 uppercase tracking-wider mb-1">Full Name</div>
              <div className="text-sm font-semibold text-foreground">{user?.fullName ?? "Not set"}</div>
            </div>
            <div className="rounded-lg border border-border bg-glass-2 p-3.5">
              <div className="text-[0.7rem] font-bold text-txt-4 uppercase tracking-wider mb-1">Email</div>
              <div className="text-sm font-semibold text-foreground break-all">{user?.email ?? "Not set"}</div>
            </div>
            <div className="rounded-lg border border-border bg-glass-2 p-3.5">
              <div className="text-[0.7rem] font-bold text-txt-4 uppercase tracking-wider mb-1">Phone</div>
              <div className="text-sm font-semibold text-foreground">{user?.phone ?? "Not set"}</div>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-gradient-to-br from-bg-3 to-bg-2 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-400/20 border border-emerald-500/30">
              <Shield size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Security Status</h3>
              <p className="text-[0.7rem] text-txt-4">Account protection level</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-glass-2 p-3.5">
              <div className="text-[0.7rem] font-bold text-txt-4 uppercase tracking-wider mb-1">Role</div>
              <div className="text-sm font-semibold text-foreground">{user?.role ?? "ADMIN"}</div>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5">
              <div className="text-[0.7rem] font-bold text-emerald-300 uppercase tracking-wider mb-1">Password</div>
              <div className="text-sm font-semibold text-emerald-300">Bcrypt Protected</div>
            </div>
            <div className="rounded-lg border border-border bg-glass-2 p-3.5">
              <div className="text-[0.7rem] font-bold text-txt-4 uppercase tracking-wider mb-1">Avatar</div>
              <div className={`text-sm font-semibold ${avatarUrl ? "text-emerald-300" : "text-txt-3"}`}>
                {avatarUrl ? "Uploaded" : "Needs Photo"}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-gradient-to-br from-bg-3 to-bg-2 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30">
              <Sparkles size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Best Practices</h3>
              <p className="text-[0.7rem] text-txt-4">Security recommendations</p>
            </div>
          </div>

          <div className="space-y-2 text-[0.85rem]">
            <div className="flex gap-2 items-start">
              <CheckCircle2 size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <span className="text-txt-2">Use a strong password with mixed case, numbers & symbols</span>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle2 size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <span className="text-txt-2">Keep your profile photo updated for identity</span>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle2 size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <span className="text-txt-2">Review access logs regularly for security</span>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle2 size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <span className="text-txt-2">Change password every 60 days minimum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={activeModal === "personal"} onOpenChange={(open) => setActiveModal(open ? "personal" : null)}>
        <DialogContent className="max-w-2xl border-border bg-gradient-to-br from-bg-3 to-bg-2 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Personal Information</DialogTitle>
            <DialogDescription className="text-txt-3 mt-1">Update your name, email, and phone number</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="font-semibold">Full Name</Label>
              <input
                type="text"
                value={personalForm.fullName}
                onChange={(e) => setPersonalForm((current) => ({ ...current, fullName: e.target.value }))}
                className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              />
              {personalErrors.fullName && <p className="text-xs text-destructive">{personalErrors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Email Address</Label>
              <input
                type="email"
                value={personalForm.email}
                onChange={(e) => setPersonalForm((current) => ({ ...current, email: e.target.value }))}
                className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              />
              {personalErrors.email && <p className="text-xs text-destructive">{personalErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Phone Number</Label>
              <input
                type="tel"
                value={personalForm.phone}
                onChange={(e) => setPersonalForm((current) => ({ ...current, phone: e.target.value }))}
                className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              />
              {personalErrors.phone && <p className="text-xs text-destructive">{personalErrors.phone}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2.5 rounded-lg border border-border bg-glass-2 font-semibold text-sm hover:bg-glass-3 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePersonalInformation}
              disabled={!canSavePersonal || isSaving}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-primary to-accent font-semibold text-sm text-foreground hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "photo"} onOpenChange={(open) => setActiveModal(open ? "photo" : null)}>
        <DialogContent className="max-w-4xl border-border bg-gradient-to-br from-bg-3 to-bg-2 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Update Profile Photo</DialogTitle>
            <DialogDescription className="text-txt-3 mt-1">Upload and crop your profile avatar</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4 lg:grid-cols-[1fr_280px]">
            {/* Preview */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-glass-2 p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="font-semibold text-sm">Square Crop Preview</p>
                    <p className="text-xs text-txt-4">Adjust zoom and position</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 px-3 py-2 rounded-lg border border-border bg-glass-2 hover:bg-glass-3 text-sm font-semibold transition-colors">
                    <Upload size={14} />
                    Upload
                    <input
                      id="profile-photo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarSelection}
                    />
                  </label>
                </div>

                <div className="flex justify-center">
                  <div
                    className="relative overflow-hidden rounded-xl border border-border bg-bg shadow-lg"
                    style={{ width: previewSize, height: previewSize }}
                  >
                    {avatarSource ? (
                      <img
                        src={avatarSource}
                        alt="Crop preview"
                        className="absolute max-w-none"
                        style={{
                          width: renderedPreviewWidth,
                          height: renderedPreviewHeight,
                          left: previewLeft,
                          top: previewTop,
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 text-txt-4">
                        <div className="text-center">
                          <Upload size={32} className="mx-auto mb-2 text-primary/50" />
                          <p className="text-sm">Choose an image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {avatarError && <p className="text-xs text-destructive mt-2">{avatarError}</p>}
                {avatarFileName && <p className="text-xs text-txt-4 mt-2">File: {avatarFileName}</p>}
              </div>
            </div>

            {/* Controls */}
            <div className="rounded-2xl border border-border bg-glass-2 p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-txt-4 uppercase tracking-wider">Zoom</label>
                <Slider
                  value={[avatarZoom]}
                  min={1}
                  max={2.5}
                  step={0.01}
                  onValueChange={(value) => setAvatarZoom(value[0] ?? 1)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-txt-4 uppercase tracking-wider">Horizontal</label>
                <Slider
                  value={[avatarOffsetX]}
                  min={-120}
                  max={120}
                  step={1}
                  onValueChange={(value) => setAvatarOffsetX(value[0] ?? 0)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-txt-4 uppercase tracking-wider">Vertical</label>
                <Slider
                  value={[avatarOffsetY]}
                  min={-120}
                  max={120}
                  step={1}
                  onValueChange={(value) => setAvatarOffsetY(value[0] ?? 0)}
                />
              </div>

              <div className="rounded-lg border border-border bg-glass-2 p-3 text-xs text-txt-3">
                Output is always square and securely stored on the backend.
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2.5 rounded-lg border border-border bg-glass-2 font-semibold text-sm hover:bg-glass-3 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveAvatar}
              disabled={isSaving || !avatarSource}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-primary to-accent font-semibold text-sm text-foreground hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Photo"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "password"} onOpenChange={(open) => setActiveModal(open ? "password" : null)}>
        <DialogContent className="max-w-2xl border-border bg-gradient-to-br from-bg-3 to-bg-2 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Change Password</DialogTitle>
            <DialogDescription className="text-txt-3 mt-1">Enter current password and choose a stronger replacement</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {[
              { key: "current" as const, label: "Current Password", field: "currentPassword" as const },
              { key: "next" as const, label: "New Password", field: "newPassword" as const },
              { key: "confirm" as const, label: "Confirm Password", field: "confirmPassword" as const },
            ].map((item) => (
              <div key={item.field} className="space-y-2">
                <Label className="font-semibold">{item.label}</Label>
                <div className="relative">
                  <input
                    type={showPassword[item.key] ? "text" : "password"}
                    value={passwordForm[item.field]}
                    onChange={(e) =>
                      setPasswordForm((current) => ({
                        ...current,
                        [item.field]: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 pr-11 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => ({
                        ...current,
                        [item.key]: !current[item.key],
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-3 hover:text-foreground transition-colors"
                  >
                    {showPassword[item.key] ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                  </button>
                </div>
                {passwordErrors[item.field] && (
                  <p className="text-xs text-destructive">{passwordErrors[item.field]}</p>
                )}
              </div>
            ))}

            {/* Strength Indicator */}
            <div className="rounded-lg border border-border bg-glass-2 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Password Strength</span>
                <span className="text-[0.85rem] font-bold text-txt-3">{passwordStrength.label}</span>
              </div>
              <div className="h-2 bg-glass-2 rounded-full overflow-hidden border border-border">
                <div
                  className={cn("h-full rounded-full transition-all", passwordStrength.color)}
                  style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                />
              </div>
              <p className="text-xs text-txt-4">Use 8+ chars, mixed case, numbers & symbols</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2.5 rounded-lg border border-border bg-glass-2 font-semibold text-sm hover:bg-glass-3 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePassword}
              disabled={!canSavePassword || isSaving}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-primary to-accent font-semibold text-sm text-foreground hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Password"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProfile;