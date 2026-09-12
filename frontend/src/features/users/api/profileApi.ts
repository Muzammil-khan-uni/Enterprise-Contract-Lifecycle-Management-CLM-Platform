import { useMutation } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import { useAppDispatch } from '../../../shared/hooks/redux';
import { profileUpdated } from '../../auth/authSlice';

interface ItemResponse<T> {
  data: T;
}

export function useUpdateOwnProfile() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: async (input: { name: string; bio?: string | null }) => {
      const res = await axiosClient.patch<ItemResponse<{ name: string; bio: string | null }>>('/users/me', input);
      return res.data.data;
    },
    onSuccess: (data) => {
      dispatch(profileUpdated({ name: data.name, bio: data.bio }));
    },
  });
}

export function useUploadAvatar() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosClient.post<ItemResponse<{ avatarUrl: string | null }>>('/users/me/avatar', formData);
      return res.data.data;
    },
    onSuccess: (data) => {
      dispatch(profileUpdated({ avatarUrl: data.avatarUrl }));
    },
  });
}

export function useDeleteAvatar() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: async () => {
      const res = await axiosClient.delete<ItemResponse<{ avatarUrl: string | null }>>('/users/me/avatar');
      return res.data.data;
    },
    onSuccess: () => {
      dispatch(profileUpdated({ avatarUrl: null }));
    },
  });
}
