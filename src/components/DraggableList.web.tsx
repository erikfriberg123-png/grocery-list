import React from 'react';
import { FlatList, FlatListProps, View } from 'react-native';

export type RenderItemParams<T> = {
  item: T;
  drag: () => void;
  isActive: boolean;
  getIndex: () => number | undefined;
};

type DraggableProps<T> = Omit<FlatListProps<T>, 'renderItem'> & {
  renderItem: (params: RenderItemParams<T>) => React.ReactElement | null;
  onDragEnd?: (params: { data: T[]; from: number; to: number }) => void;
  activationDistance?: number;
  containerStyle?: FlatListProps<T>['style'];
};

function DraggableFlatList<T>({ renderItem, onDragEnd: _onDragEnd, activationDistance: _a, containerStyle, style, ...rest }: DraggableProps<T>) {
  const wrappedRenderItem = ({ item, index }: { item: T; index: number }) =>
    renderItem({ item, drag: () => {}, isActive: false, getIndex: () => index });

  return (
    <FlatList
      {...rest}
      style={[containerStyle, { flex: 1 }, style]}
      renderItem={wrappedRenderItem}
    />
  );
}

export default DraggableFlatList;

export function ScaleDecorator({ children }: { children: React.ReactNode; activeScale?: number }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
