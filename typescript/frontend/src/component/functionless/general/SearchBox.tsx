import { InputText } from './form/InputText';
import { SubmitButton } from './form/SubmitButton';

type SearchBoxProps = {
  search: string;
  setSearch: (search: string) => void;
  handleSearch: (payload: FormData) => void;
  searchErrorMessage?: string;
};

export function SearchBox(props: SearchBoxProps) {
  const { search, setSearch, handleSearch, searchErrorMessage } = props;

  return (
    <div className="w-full max-w-md">
      <form action={handleSearch} className="space-y-4">
        <InputText
          label="タイトル検索"
          name="search"
          placeholder="Enter search"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          errorMessage={searchErrorMessage}
        />

        <SubmitButton size="md" variant="primary">
          Search
        </SubmitButton>
      </form>
    </div>
  );
}
