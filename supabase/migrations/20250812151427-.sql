-- Recreate policies without IF NOT EXISTS
-- profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by self" ON public.profiles;
CREATE POLICY "Profiles are viewable by self"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- organizations policies
DROP POLICY IF EXISTS "Org members can view org" ON public.organizations;
CREATE POLICY "Org members can view org"
  ON public.organizations FOR SELECT TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = id and m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Authenticated can create org" ON public.organizations;
CREATE POLICY "Authenticated can create org"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Org admins can update org" ON public.organizations;
CREATE POLICY "Org admins can update org"
  ON public.organizations FOR UPDATE TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));

DROP POLICY IF EXISTS "Org owners can delete org" ON public.organizations;
CREATE POLICY "Org owners can delete org"
  ON public.organizations FOR DELETE TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner'
  ));

-- org_members policies
DROP POLICY IF EXISTS "Users view their memberships" ON public.org_members;
CREATE POLICY "Users view their memberships"
  ON public.org_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own membership" ON public.org_members;
CREATE POLICY "Users can insert own membership"
  ON public.org_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage org members" ON public.org_members;
CREATE POLICY "Admins manage org members"
  ON public.org_members FOR UPDATE TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));

DROP POLICY IF EXISTS "Owners remove org members" ON public.org_members;
CREATE POLICY "Owners remove org members"
  ON public.org_members FOR DELETE TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role = 'owner'
  ));

-- classes policies
DROP POLICY IF EXISTS "Public can view published classes" ON public.classes;
CREATE POLICY "Public can view published classes"
  ON public.classes FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS "Members view org classes" ON public.classes;
CREATE POLICY "Members view org classes"
  ON public.classes FOR SELECT TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins create classes" ON public.classes;
CREATE POLICY "Admins create classes"
  ON public.classes FOR INSERT TO authenticated
  WITH CHECK (
    exists (select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin'))
    and created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Admins update classes" ON public.classes;
CREATE POLICY "Admins update classes"
  ON public.classes FOR UPDATE TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));

DROP POLICY IF EXISTS "Admins delete classes" ON public.classes;
CREATE POLICY "Admins delete classes"
  ON public.classes FOR DELETE TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));

-- bookings policies
DROP POLICY IF EXISTS "Members view bookings" ON public.bookings;
CREATE POLICY "Members view bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Public can create booking" ON public.bookings;
CREATE POLICY "Public can create booking"
  ON public.bookings FOR INSERT TO anon
  WITH CHECK (exists (
    select 1 from public.classes c where c.id = class_id and c.published = true
  ));

DROP POLICY IF EXISTS "Users can create booking" ON public.bookings;
CREATE POLICY "Users can create booking"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (exists (
    select 1 from public.classes c where c.id = class_id and c.published = true
  ));

DROP POLICY IF EXISTS "Admins update bookings" ON public.bookings;
CREATE POLICY "Admins update bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));

DROP POLICY IF EXISTS "Admins delete bookings" ON public.bookings;
CREATE POLICY "Admins delete bookings"
  ON public.bookings FOR DELETE TO authenticated
  USING (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));