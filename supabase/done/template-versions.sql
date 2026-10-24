-- 고객 응대 템플릿: 저장할 때마다 자동으로 사본을 남기는 기록 표 (정보 섹션과 같은 방식)
drop trigger if exists templates_version on templates;
drop table if exists template_versions;
drop function if exists templates_version();

create table template_versions (
  id          bigint generated always as identity primary key,
  template_id bigint not null references templates(id) on delete cascade,
  name        text not null,
  when_to     text,
  body        text not null,
  note        text,
  saved_at    timestamptz not null default now()
);

create function templates_version() returns trigger language plpgsql as $$
begin
  insert into template_versions (template_id, name, when_to, body, note)
  values (new.id, new.name, new.when_to, new.body, new.note);
  return new;
end $$;

-- 순서(sort_order)만 바뀌는 건 기록 안 남음
create trigger templates_version
after insert or update of name, when_to, body, note on templates
for each row execute function templates_version();

alter table template_versions enable row level security;
create policy "owner_only" on template_versions for all to authenticated
  using (auth.jwt()->>'email' = 'gjow2007@gmail.com') with check (auth.jwt()->>'email' = 'gjow2007@gmail.com');

-- 지금 있는 문구들을 각자의 첫 기록으로
insert into template_versions (template_id, name, when_to, body, note)
select id, name, when_to, body, note from templates;
