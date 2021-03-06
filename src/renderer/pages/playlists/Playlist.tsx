import cn from 'classnames';
import * as React from 'react';
import * as isDeepEqual from 'react-fast-compare';
import { connect, MapDispatchToProps } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { StoreState } from '../../../common/store';
import { getAuthAllPlaylistsIfNeeded, getAuthLikesIfNeeded, getAuthTracksIfNeeded } from '../../../common/store/auth';
import { fetchChartsIfNeeded, fetchMore, ObjectState, ObjectTypes, PlaylistTypes } from '../../../common/store/objects';
import { getPlaylistObjectSelector } from '../../../common/store/objects/selectors';
import { SortTypes } from '../../../common/store/playlist/types';
import { setScrollPosition } from '../../../common/store/ui';
import { getPreviousScrollTop } from '../../../common/store/ui/selectors';
import { NormalizedResult } from '../../../types';
import WithHeaderComponent from '../../_shared/WithHeaderComponent';
import CustomScroll from '../../_shared/CustomScroll';
import Header from '../../app/components/Header/Header';
import PageHeader from '../../_shared/PageHeader/PageHeader';
import TracksGrid from '../../_shared/TracksGrid/TracksGrid';
import Spinner from '../../_shared/Spinner/Spinner';

interface OwnProps {
    objectId: string;
    title: string;
    backgroundImage?: string;
    gradient?: string;
    sortType?: SortTypes;
    showInfo?: boolean;
    chart?: boolean;
    sortTypeChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

interface PropsFromState {
    playlistObject: ObjectState<NormalizedResult> | null;
    previousScrollTop?: number;
}

interface PropsFromDispatch {
    fetchMore: typeof fetchMore;
    setScrollPosition: typeof setScrollPosition;
    fetchChartsIfNeeded: typeof fetchChartsIfNeeded;
    getAuthLikesIfNeeded: typeof getAuthLikesIfNeeded;
    getAuthTracksIfNeeded: typeof getAuthTracksIfNeeded;
    getAuthAllPlaylistsIfNeeded: typeof getAuthAllPlaylistsIfNeeded;
}

interface State {
    scrollTop: number;
}

type AllProps = OwnProps & PropsFromState & PropsFromDispatch & RouteComponentProps<{}>;

class Playlist extends WithHeaderComponent<AllProps, State> {

    static defaultProps: Partial<AllProps> = {
        showInfo: false,
        chart: false
    };

    componentDidMount() {
        super.componentDidMount();

        this.fetchPlaylist();
    }

    shouldComponentUpdate(nextProps: AllProps, nextState: State) {

        if (
            !isDeepEqual(nextProps, this.props) ||
            nextState.scrollTop !== this.state.scrollTop
        ) {
            return true;
        }

        return false;
    }

    componentDidUpdate() {
        this.fetchPlaylist();
    }

    fetchPlaylist = () => {
        const {
            playlistObject,
            chart,
            fetchChartsIfNeeded,
            sortType,
            fetchMore,
            objectId,
            getAuthLikesIfNeeded,
            getAuthTracksIfNeeded,
            getAuthAllPlaylistsIfNeeded
        } = this.props;

        if (!playlistObject) {

            if (chart) {
                fetchChartsIfNeeded(objectId, sortType);
            } else {
                switch (objectId) {
                    case PlaylistTypes.LIKES:
                        getAuthLikesIfNeeded();
                        break;
                    case PlaylistTypes.MYTRACKS:
                        getAuthTracksIfNeeded();
                        break;
                    case PlaylistTypes.PLAYLISTS:
                        getAuthAllPlaylistsIfNeeded();
                        break;
                    default:
                        break;
                }
            }

        } else if (!playlistObject || playlistObject.items.length === 0 && (playlistObject && !playlistObject.isFetching)) {
            fetchMore(objectId, ObjectTypes.PLAYLISTS);
        }
    }

    renderChartSort = () => {
        const {
            sortTypeChange,
            sortType,
        } = this.props;

        return (
            <div className='float-right'>
                <div className='bp3-select bp3-minimal'>
                    <select
                        defaultValue={sortType}
                        value={sortType}
                        onChange={sortTypeChange}
                    >
                        <option value={SortTypes.TOP}>{SortTypes.TOP}</option>
                        <option value={SortTypes.TRENDING}>{SortTypes.TRENDING}</option>
                    </select>
                </div>
            </div>
        );
    }

    render() {
        const {
            playlistObject,
            objectId,
            showInfo,
            title,
            chart,
            backgroundImage,
            gradient,
            fetchMore,
        } = this.props;

        if (!playlistObject || (playlistObject && playlistObject.items.length === 0 && playlistObject.isFetching)) {
            return <Spinner contained={true} />;
        }

        return (
            <CustomScroll
                heightRelativeToParent='100%'
                // heightMargin={35}
                allowOuterScroll={true}
                threshold={300}
                isFetching={playlistObject.isFetching}
                ref={(r) => this.scroll = r}
                loadMore={() => {
                    fetchMore(objectId, ObjectTypes.PLAYLISTS);
                }}
                loader={<Spinner />}
                onScroll={this.debouncedOnScroll}
                hasMore={!!playlistObject.nextUrl}
            >

                <Header
                    className={cn({ withImage: backgroundImage })}
                    scrollTop={this.state.scrollTop}
                />

                <PageHeader
                    image={backgroundImage}
                    gradient={gradient}
                >
                    <>
                        {
                            chart && this.renderChartSort()
                        }
                        <h2>{title}</h2>
                    </>
                </PageHeader>

                {
                    (!playlistObject.items.length) ? (
                        <div className='pt-5 mt-5'>
                            <h5 className='text-muted text-center'>That's unfortunate, you don't seem to have any tracks in here</h5>
                            <div className='text-center' style={{ fontSize: '5rem' }}>
                                🧐
                            </div>
                        </div>
                    ) : (
                            <TracksGrid
                                items={playlistObject.items}
                                objectId={objectId}
                                showInfo={showInfo}
                            />
                        )
                }

            </CustomScroll>
        );
    }
}

const mapStateToProps = (state: StoreState, props: OwnProps): PropsFromState => {
    const { objectId } = props;

    return {
        playlistObject: getPlaylistObjectSelector(objectId)(state),
        previousScrollTop: getPreviousScrollTop(state)
    };
};

const mapDispatchToProps: MapDispatchToProps<PropsFromDispatch, OwnProps> = (dispatch) => bindActionCreators({
    fetchMore,
    setScrollPosition,
    fetchChartsIfNeeded,
    getAuthLikesIfNeeded,
    getAuthTracksIfNeeded,
    getAuthAllPlaylistsIfNeeded,
}, dispatch);

export default connect<PropsFromState, PropsFromDispatch, OwnProps, StoreState>(mapStateToProps, mapDispatchToProps)(withRouter(Playlist));
