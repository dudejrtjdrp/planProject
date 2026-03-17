"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostInput } from "@/components/posts/post-input";
import { PostList, type Post } from "@/components/posts/post-list";
import { getSupabaseClient } from "@/lib/supabaseClient";

function addPostUnique(previous: Post[], incoming: Post): Post[] {
  if (previous.some((post) => post.id === incoming.id)) {
    return previous;
  }

  return [incoming, ...previous];
}

function updatePostById(previous: Post[], incoming: Post): Post[] {
  return previous.map((post) => (post.id === incoming.id ? incoming : post));
}

function removePostById(previous: Post[], postId: string): Post[] {
  return previous.filter((post) => post.id !== postId);
}

export default function HomePage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    const selectedProfile = window.localStorage.getItem("currentUser");
    if (!selectedProfile) {
      router.replace("/profile");
      return;
    }

    setCurrentUser(selectedProfile);
  }, [router]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
      setClientError(null);
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Failed to initialize Supabase client");
      setIsLoading(false);
      return;
    }

    async function loadPosts() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, author, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load posts", error);
        setIsLoading(false);
        return;
      }

      setPosts((data ?? []) as Post[]);
      setIsLoading(false);
    }

    void loadPosts();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => addPostUnique(prev, payload.new as Post));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => updatePostById(prev, payload.new as Post));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          const deleted = payload.old as { id?: string };
          if (!deleted.id) {
            return;
          }
          setPosts((prev) => removePostById(prev, deleted.id as string));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUser]);

  async function handleCreatePost(content: string) {
    const author = window.localStorage.getItem("currentUser");
    if (!author) {
      router.replace("/profile");
      throw new Error("프로필을 먼저 선택해 주세요.");
    }

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
      setClientError(null);
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Failed to initialize Supabase client");
      throw error instanceof Error ? error : new Error("Failed to initialize Supabase client");
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({ content, author })
      .select("id, content, author, created_at")
      .single();

    if (error) {
      console.error("Failed to create post", error);
      throw new Error(error.message);
    }

    if (data) {
      setPosts((prev) => addPostUnique(prev, data as Post));
    }
  }

  async function handleUpdatePost(postId: string, content: string) {
    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
      setClientError(null);
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Failed to initialize Supabase client");
      throw error instanceof Error ? error : new Error("Failed to initialize Supabase client");
    }

    const { data, error } = await supabase
      .from("posts")
      .update({ content })
      .eq("id", postId)
      .eq("author", currentUser)
      .select("id, content, author, created_at")
      .single();

    if (error) {
      console.error("Failed to update post", error);
      throw new Error(error.message);
    }

    if (data) {
      setPosts((prev) => updatePostById(prev, data as Post));
    }
  }

  async function handleDeletePost(postId: string) {
    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
      setClientError(null);
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Failed to initialize Supabase client");
      throw error instanceof Error ? error : new Error("Failed to initialize Supabase client");
    }

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("author", currentUser);

    if (error) {
      console.error("Failed to delete post", error);
      throw new Error(error.message);
    }

    setPosts((prev) => removePostById(prev, postId));
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main className="w-full">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">Current Profile</p>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{currentUser}</h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/projects"
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
              >
                Projects
              </Link>
              <Link
                href="/profile"
                className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95"
              >
                Switch Profile
              </Link>
            </div>
          </div>
        </div>

        <PostInput onSubmit={handleCreatePost} />

        {clientError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-base text-rose-700 shadow-sm">
            {clientError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-base text-gray-700 shadow-sm">
            Loading posts...
          </div>
        ) : (
          <PostList
            posts={posts}
            currentUser={currentUser}
            onUpdate={handleUpdatePost}
            onDelete={handleDeletePost}
          />
        )}
      </section>
    </main>
  );
}
