type UserLike = { id?: string; _id?: string } | null | undefined;

export function getUserId(user?: UserLike): string | null {
  if (!user) return null;
  if (typeof user.id === 'string' && user.id) return user.id;
  if (typeof user._id === 'string' && user._id) return user._id;
  return null;
}

export function appendUserId(path: string, userId?: string | null): string {
  if (!userId) return path;

  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  params.set('userId', userId);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
