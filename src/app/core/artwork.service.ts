import { httpResource } from '@angular/common/http';
import { Injectable, computed } from '@angular/core';
import { Artwork } from './artwork';

@Injectable({ providedIn: 'root' })
export class ArtworkService {
  private readonly resource = httpResource<Artwork[]>(() => 'data/artworks.json', { defaultValue: [] });

  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;
  readonly artworks = computed(() => (this.resource.hasValue() ? this.resource.value() : []));

  private readonly byId = computed(() => new Map(this.artworks().map((artwork) => [artwork.id, artwork])));

  find(id: number): Artwork | undefined {
    return this.byId().get(id);
  }
}