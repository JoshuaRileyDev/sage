import { List, Detail } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import * as service from './oauth';

export default function Command() {
  const { isLoading } = usePromise(async () => {
    await service.authorize();
    return true;
  }, []);

  if (isLoading) {
    return <Detail isLoading={isLoading} />;
  }

  return (
    <List isLoading={isLoading}>
    </List>
  );
}
