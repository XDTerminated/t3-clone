export interface ChatForGrouping {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
}

export interface GroupedChats {
  pinned: ChatForGrouping[];
  today: ChatForGrouping[];
  yesterday: ChatForGrouping[];
  last30Days: ChatForGrouping[];
  older: ChatForGrouping[];
}

/**
 * Groups chats by time period (pinned, today, yesterday, last 30 days, older)
 */
export function groupChatsByDate(chats: ChatForGrouping[]): GroupedChats {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Separate pinned and unpinned chats
  const pinnedChats = chats.filter((chat) => chat.pinned);
  const unpinnedChats = chats.filter((chat) => !chat.pinned);

  // Group unpinned chats by date
  const todayChats = unpinnedChats.filter((chat) => {
    const chatDate = new Date(chat.updatedAt);
    return chatDate >= today;
  });

  const yesterdayChats = unpinnedChats.filter((chat) => {
    const chatDate = new Date(chat.updatedAt);
    return chatDate >= yesterday && chatDate < today;
  });

  const last30DaysChats = unpinnedChats.filter((chat) => {
    const chatDate = new Date(chat.updatedAt);
    return chatDate >= thirtyDaysAgo && chatDate < yesterday;
  });

  const olderChats = unpinnedChats.filter((chat) => {
    const chatDate = new Date(chat.updatedAt);
    return chatDate < thirtyDaysAgo;
  });

  return {
    pinned: pinnedChats,
    today: todayChats,
    yesterday: yesterdayChats,
    last30Days: last30DaysChats,
    older: olderChats,
  };
}
