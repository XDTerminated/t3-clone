"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useApiKey } from "~/contexts/ApiKeyContext";
import { useCustomization } from "~/contexts/CustomizationContext";
import { useToast } from "~/components/toast";
import { useAuth, useUser } from "@clerk/nextjs";
import { 
  User, 
  Palette, 
  Key, 
  X, 
  LogOut,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { cn } from "~/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SettingsTab = 'account' | 'customization' | 'api-keys';

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    openRouterApiKey,
    geminiApiKey,
    groqApiKey,
    customOpenRouterModels,
    setOpenRouterApiKey,
    setGeminiApiKey,
    setGroqApiKey,
    addCustomOpenRouterModel,
    removeCustomOpenRouterModel,
    hasUserProvidedOpenRouterKey,
    hasUserProvidedGeminiKey,
    hasUserProvidedGroqKey,
  } = useApiKey();
  
  const {
    userName,
    userRole,
    userInterests,
    setUserName,
    setUserRole,
    setUserInterests,
  } = useCustomization();

  const { signOut } = useAuth();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [newOpenRouterKey, setNewOpenRouterKey] = useState("");
  const [newGeminiKey, setNewGeminiKey] = useState("");
  const [newGroqKey, setNewGroqKey] = useState("");
  const [newCustomModel, setNewCustomModel] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  
  // Customization form states
  const [tempUserName, setTempUserName] = useState(userName);
  const [tempUserRole, setTempUserRole] = useState(userRole);
  const [tempUserInterests, setTempUserInterests] = useState(userInterests);
  const [customizationSaved, setCustomizationSaved] = useState(false);

  const { showToast } = useToast();
  const customizationSavedTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearCustomizationSavedTimeout = () => {
    if (customizationSavedTimeout.current) {
      clearTimeout(customizationSavedTimeout.current);
      customizationSavedTimeout.current = null;
    }
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setValidationError("");

    try {
      // Validate OpenRouter key if provided
      if (newOpenRouterKey.trim()) {
        const response = await fetch("/api/validate-openrouter-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey: newOpenRouterKey.trim() }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          setValidationError(
            `OpenRouter: ${errorData.error ?? "Invalid API key"}`,
          );
          return;
        }

        setOpenRouterApiKey(newOpenRouterKey.trim());
        setNewOpenRouterKey("");
      }
      
      if (newGeminiKey.trim()) {
        setGeminiApiKey(newGeminiKey.trim());
        setNewGeminiKey("");
      }

      if (newGroqKey.trim()) {
        setGroqApiKey(newGroqKey.trim());
        setNewGroqKey("");
      }
    } catch (error) {
      console.error("API key validation failed:", error);
      setValidationError("Failed to validate API key. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const isCustomizationDirty = useMemo(
    () =>
      tempUserName !== userName ||
      tempUserRole !== userRole ||
      tempUserInterests !== userInterests,
    [
      tempUserName,
      tempUserRole,
      tempUserInterests,
      userName,
      userRole,
      userInterests,
    ],
  );

  useEffect(() => {
    if (open) {
      setTempUserName(userName);
      setTempUserRole(userRole);
      setTempUserInterests(userInterests);
    }
  }, [open, userName, userRole, userInterests]);

  useEffect(() => {
    if (isCustomizationDirty) {
      setCustomizationSaved(false);
      clearCustomizationSavedTimeout();
    }
  }, [isCustomizationDirty]);

  useEffect(() => {
    return () => {
      clearCustomizationSavedTimeout();
    };
  }, []);

  const handleCustomizationSave = () => {
    const trimmedName = tempUserName.trim();
    const trimmedRole = tempUserRole.trim();
    const trimmedInterests = tempUserInterests.trim();

    setUserName(trimmedName);
    setUserRole(trimmedRole);
    setUserInterests(trimmedInterests);

    setTempUserName(trimmedName);
    setTempUserRole(trimmedRole);
    setTempUserInterests(trimmedInterests);

    setCustomizationSaved(true);
    clearCustomizationSavedTimeout();
    customizationSavedTimeout.current = setTimeout(() => {
      setCustomizationSaved(false);
      customizationSavedTimeout.current = null;
    }, 2500);

    showToast("Your preferences are saved and will personalize future replies.");
  };

  const handleClose = () => {
    setNewOpenRouterKey("");
    setNewGeminiKey("");
    setNewGroqKey("");
    setNewCustomModel("");
    setValidationError("");
    setTempUserName(userName);
    setTempUserRole(userRole);
    setTempUserInterests(userInterests);
    setCustomizationSaved(false);
    clearCustomizationSavedTimeout();
    onOpenChange(false);
  };

  const handleAddCustomModel = () => {
    const modelId = newCustomModel.trim();
    if (modelId) {
      addCustomOpenRouterModel(modelId);
      setNewCustomModel("");
    }
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    handleClose();
  };

  const handleSignOut = () => {
    signOut();
    handleClose();
  };

  const tabs = [
    { id: 'account' as SettingsTab, label: 'Account', icon: User },
    { id: 'customization' as SettingsTab, label: 'Customization', icon: Palette },
    { id: 'api-keys' as SettingsTab, label: 'API Keys', icon: Key },
  ];

  const renderAccountSection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">Account Settings</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Manage your account information, security settings, and preferences
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Information Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Profile Information</h3>
                <p className="text-sm text-muted-foreground">Your account details and status</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {user?.imageUrl ? (
                <div className="relative">
                  <img 
                    src={user.imageUrl} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-2xl border-2 border-border object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-background flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-border">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <h4 className="text-xl font-semibold">{user?.fullName || user?.firstName || 'User'}</h4>
                <p className="text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active Account</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Account Actions Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <LogOut className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Account Actions</h3>
                <p className="text-sm text-muted-foreground">Manage your session and account security</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-300 mb-1">Sign Out</h4>
                    <p className="text-sm text-red-700 dark:text-red-400">End your current session and return to the login page</p>
                  </div>
                  <Button 
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700/50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomizationSection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">Personalize Your Experience</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Help LeemerChat understand you better by sharing some information. This enables more relevant, personalized, and helpful responses.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Personal Info Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Personal Information</h3>
                <p className="text-sm text-muted-foreground">How should LeemerChat address you?</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-foreground mb-2">
                  Display Name
                </label>
                <Input
                  id="user-name"
                  value={tempUserName}
                  onChange={(e) => setTempUserName(e.target.value)}
                  placeholder="What should I call you?"
                  className="h-12 text-base bg-background/80 border-border/60 rounded-xl px-4 focus:border-primary/60 focus:bg-background transition-all duration-200"
                  maxLength={50}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">This is how LeemerChat will greet you</p>
                  <span className="text-xs text-muted-foreground">{tempUserName.length}/50</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Details Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Professional Details</h3>
                <p className="text-sm text-muted-foreground">Your work and expertise area</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="user-role" className="block text-sm font-medium text-foreground mb-2">
                  Role or Profession
                </label>
                <Input
                  id="user-role"
                  value={tempUserRole}
                  onChange={(e) => setTempUserRole(e.target.value)}
                  placeholder="Software Engineer, Student, Designer, etc."
                  className="h-12 text-base bg-background/80 border-border/60 rounded-xl px-4 focus:border-primary/60 focus:bg-background transition-all duration-200"
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">Helps provide relevant professional context</p>
                  <span className="text-xs text-muted-foreground">{tempUserRole.length}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Context Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Additional Context</h3>
                <p className="text-sm text-muted-foreground">Share your interests, preferences, or anything else</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="user-interests" className="block text-sm font-medium text-foreground mb-2">
                  Interests & Preferences
                </label>
                <textarea
                  id="user-interests"
                  value={tempUserInterests}
                  onChange={(e) => setTempUserInterests(e.target.value)}
                  placeholder="Share your interests, hobbies, values, communication preferences, or anything else that would help LeemerChat provide better responses..."
                  className="min-h-[140px] w-full px-4 py-3 text-base bg-transparent border border-input rounded-xl focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none transition-[color,box-shadow] duration-200 leading-relaxed"
                  maxLength={3000}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">The more context you provide, the more personalized the responses</p>
                  <span className="text-xs text-muted-foreground">{tempUserInterests.length}/3000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex flex-col items-center justify-center gap-2 pt-4">
          <Button 
            onClick={handleCustomizationSave}
            size="lg"
            className="px-8 py-3 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            disabled={!isCustomizationDirty}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {customizationSaved ? "Saved" : "Save All Changes"}
          </Button>
          {customizationSaved && (
            <p className="text-sm text-muted-foreground">
              We'll remember these details on this device for future chats.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderApiKeysSection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">API Keys</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          LeemerChat offers an array of strong models for free (with limits) and higher limits for just $14/month. For even more models and unlimited usage, add your personal API keys below.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleApiKeySubmit} className="space-y-6">
        {/* OpenRouter API Key Section */}
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-400/10 to-red-500/10 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                <Key className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold mb-1">OpenRouter API Key</h4>
                <p className="text-sm text-muted-foreground">
                  Access 200+ additional models including Claude, GPT variants, Llama, and more
                </p>
              </div>
              {hasUserProvidedOpenRouterKey && (
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Personal Key Active</span>
                </div>
              )}
            </div>
          
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Current Status</label>
                <div className="p-4 bg-muted/20 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${hasUserProvidedOpenRouterKey ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <span className="font-mono text-sm">
                        {hasUserProvidedOpenRouterKey ? `sk-or-v1-${"•".repeat(32)}` : "LeemerChat provides select models"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {hasUserProvidedOpenRouterKey ? "Your personal API key unlocks all models" : "Add your key for 200+ additional models and unlimited usage"}
                  </p>
                </div>
              </div>
          
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Add Your Personal Key for More Models</label>
                <Input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={newOpenRouterKey}
                  onChange={(e) => setNewOpenRouterKey(e.target.value)}
                  className="h-12 font-mono text-base bg-background/80 border-border/60 rounded-xl px-4 focus:border-primary/60 focus:bg-background transition-all duration-200"
                  disabled={isValidating}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">OpenRouter Console</a>
                  </p>
                  <span className="text-xs text-muted-foreground">Unlock 200+ models • $0.50-$20 per 1M tokens</span>
                </div>
                <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-900/30">
                  <p className="text-xs text-orange-800 dark:text-orange-300">
                    <strong>Benefits:</strong> Access to Claude 4, GPT-4, advanced Llama models, DeepSeek, and 200+ other models not available in the default selection. Perfect for power users who need specific models or unlimited usage.
                  </p>
                </div>
              </div>

              {/* Custom Model IDs Section */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <label className="text-sm font-medium text-foreground">Add Custom Model IDs</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., anthropic/claude-3-opus, openai/gpt-4-turbo"
                    value={newCustomModel}
                    onChange={(e) => setNewCustomModel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomModel())}
                    className="flex-1 h-10 text-sm bg-background/80 border-border/60 rounded-lg px-3 focus:border-primary/60 focus:bg-background transition-all duration-200"
                    disabled={isValidating}
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomModel}
                    variant="outline"
                    size="sm"
                    className="px-3 h-10 text-sm"
                    disabled={!newCustomModel.trim() || isValidating}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add specific OpenRouter model IDs that aren't shown in the default selection
                </p>
                
                {/* Show current custom models */}
                {customOpenRouterModels.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Custom Models:</p>
                    <div className="flex flex-wrap gap-2">
                      {customOpenRouterModels.map((modelId) => (
                        <div
                          key={modelId}
                          className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50 text-sm"
                        >
                          <span className="font-mono">{modelId}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomOpenRouterModel(modelId)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gemini API Key Section */}
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold mb-1">Google Gemini API Key</h4>
                <p className="text-sm text-muted-foreground">
                  Direct access to Gemini models with advanced multimodal capabilities
                </p>
              </div>
              {hasUserProvidedGeminiKey && (
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Personal Key Active</span>
                </div>
              )}
            </div>
          
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Current Status</label>
                <div className="p-4 bg-muted/20 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${hasUserProvidedGeminiKey ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="font-mono text-sm">
                        {hasUserProvidedGeminiKey ? `AI${"•".repeat(36)}` : "No personal key configured"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {hasUserProvidedGeminiKey ? "Direct access to Google's Gemini models" : "Add your key for direct Google Gemini access"}
                  </p>
                </div>
              </div>
          
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Add Your Personal Gemini Key</label>
                <Input
                  type="password"
                  placeholder="AI..."
                  value={newGeminiKey}
                  onChange={(e) => setNewGeminiKey(e.target.value)}
                  className="h-12 font-mono text-base bg-background/80 border-border/60 rounded-xl px-4 focus:border-primary/60 focus:bg-background transition-all duration-200"
                  disabled={isValidating}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Google AI Studio</a>
                  </p>
                  <span className="text-xs text-muted-foreground">Free tier available • High quota</span>
                </div>
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-900/30">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Benefits:</strong> Direct access to Google's latest Gemini models including 2.5 Pro, multimodal capabilities, and generous free tier. Ideal for vision tasks, document analysis, and advanced reasoning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Groq API Key Section */}
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                <Key className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold mb-1">Groq API Key</h4>
                <p className="text-sm text-muted-foreground">
                  Ultra-fast inference with Llama, Mixtral, DeepSeek, and Qwen models
                </p>
              </div>
              {hasUserProvidedGroqKey && (
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Personal Key Active</span>
                </div>
              )}
            </div>
          
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Current Status</label>
                <div className="p-4 bg-muted/20 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${hasUserProvidedGroqKey ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="font-mono text-sm">
                        {hasUserProvidedGroqKey ? `gsk_${"•".repeat(30)}` : "No personal key configured"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {hasUserProvidedGroqKey ? "Lightning-fast Groq inference active" : "Add your key for ultra-fast Groq models"}
                  </p>
                </div>
              </div>
          
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Add Your Personal Groq Key</label>
                <Input
                  type="password"
                  placeholder="gsk_..."
                  value={newGroqKey}
                  onChange={(e) => setNewGroqKey(e.target.value)}
                  className="h-12 font-mono text-base bg-background/80 border-border/60 rounded-xl px-4 focus:border-primary/60 focus:bg-background transition-all duration-200"
                  disabled={isValidating}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">Groq Console</a>
                  </p>
                  <span className="text-xs text-muted-foreground">Free tier: 14,400 tokens/min</span>
                </div>
                <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    <strong>Benefits:</strong> Experience lightning-fast inference speeds with Llama 4, DeepSeek R1, and Qwen models. Groq's hardware acceleration provides near-instant responses with generous free tier limits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {validationError && (
          <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-500/10 rounded-lg flex-shrink-0">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-300 mb-1">Validation Error</h4>
                <p className="text-sm text-red-700 dark:text-red-400">{validationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-center pt-4">
          <Button
            type="submit"
            size="lg"
            className="px-8 py-3 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            disabled={isValidating || (!newOpenRouterKey.trim() && !newGeminiKey.trim() && !newGroqKey.trim())}
          >
            {isValidating ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Validating Keys...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Save API Keys
              </>
            )}
          </Button>
        </div>
        </form>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 translate-x-0 translate-y-0 w-screen h-screen max-w-none max-h-none p-0 m-0 rounded-none border-0 bg-background overflow-hidden"
        style={{ transform: "none" }}
      >
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">Settings</DialogTitle>
        
        <div className="flex h-full min-h-0 min-w-0">
          {/* Sidebar Navigation */}
          <div className="w-72 bg-sidebar backdrop-blur-sm border-r border-sidebar-border flex flex-col">
            <div className="px-6 py-5 border-b border-sidebar-border/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-8 w-8 p-0 hover:bg-muted/50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold">Settings</h2>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-muted/40 text-foreground border border-sidebar-border/50 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                    )}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 settings-gradient overflow-hidden min-h-0 min-w-0">
            <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
              <div className="max-w-5xl mx-auto p-8 py-12">
                {activeTab === 'account' && renderAccountSection()}
                {activeTab === 'customization' && renderCustomizationSection()}
                {activeTab === 'api-keys' && renderApiKeysSection()}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
