import { InputText } from './form/InputText';

type SearchBoxProps = {
  search: string;
  setSearch: (search: string) => void;
  handleSearch: (payload: FormData) => void;
  searchErrorMessage?: string;
};

export function SearchBox(props: SearchBoxProps) {
  const { search, setSearch, handleSearch, searchErrorMessage } = props;

  return (
    <div className="flex items-center gap-2">
      <form action={handleSearch}>
        <InputText
          label="タイトル検索"
          name="search"
          placeholder="Enter search"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          errorMessage={searchErrorMessage}
        />

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Search
        </button>
      </form>
    </div>
  );
}
