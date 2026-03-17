-- Align existing profile rows to the fixed Korean profile set.

update public.profiles set name = '성효', avatar_color = '#3B82F6', updated_at = now() where name = 'Alex';
update public.profiles set name = '죤슨빌', avatar_color = '#8B5CF6', updated_at = now() where name = 'Mina';
update public.profiles set name = '믹자', avatar_color = '#10B981', updated_at = now() where name = 'Joon';
update public.profiles set name = '지건', avatar_color = '#F59E0B', updated_at = now() where name = 'Sora';
update public.profiles set avatar_color = '#64748B', updated_at = now() where name = 'Guest';

insert into public.profiles (name, avatar_color)
values
  ('성효', '#3B82F6'),
  ('죤슨빌', '#8B5CF6'),
  ('믹자', '#10B981'),
  ('지건', '#F59E0B'),
  ('Guest', '#64748B')
on conflict (name)
do update
set avatar_color = excluded.avatar_color,
    updated_at = now();
