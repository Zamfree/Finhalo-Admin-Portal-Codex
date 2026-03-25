export type DrawerTabKey = string;

export type DrawerTabDefinition<TTab extends DrawerTabKey = DrawerTabKey> = {
  id: TTab;
  label: string;
};

export type DrawerQueryConfig = {
  detailKey: string;
  tabKey: string;
};
